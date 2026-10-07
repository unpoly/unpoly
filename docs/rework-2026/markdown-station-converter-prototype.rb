require 'nokogiri'

# Prototype: converts the content region of a rendered unpoly.com page
# (the template output rendered with layout: false) into agent-facing Markdown.
#
# Knowledge about the site's HTML lives in three lists (DROP, KEEP_CHROME, and the
# handlers for a handful of classes). Everything else is generic HTML -> GFM.
class HtmlToMd
  ORIGIN = 'https://unpoly.com'

  # Chrome that has no place in the Markdown.
  DROP = [
    '.edit-link', 'nav.toc', '.minitoc--items', '.reading-nav', '[hidden]',
    '.feature--param-experimental-icon', 'i.fa', '.pearl-title--divider',
    'script', 'style', 'button',
  ].join(', ')

  # link_style: :absolute_md  -> https://unpoly.com/up.render.md#anchor
  #             :root_md      -> /up.render.md#anchor
  #             :resolver     -> block decides (used by the skill build to make relative file paths)
  def initialize(link_style: :absolute_md, &resolver)
    @link_style = link_style
    @resolver = resolver
  end

  def convert(html)
    doc = Nokogiri::HTML.fragment(html)
    doc.css(DROP).each(&:remove)
    out = block(doc).gsub(/\n{3,}/, "\n\n").strip + "\n"
    out
  end

  private

  def block(node)
    node.children.map { |child| block_node(child) }.join
  end

  def block_node(node)
    return '' if node.comment?
    if node.text?
      text = node.text.gsub(/\s+/, ' ')
      return text.strip.empty? ? '' : text
    end

    cls = node['class'].to_s.split

    case node.name
    when 'h1'
      breadcrumb = node.at_css('.breadcrumb')&.remove
      subtitle = node.at_css('.subtitle')&.remove
      title = clean(node.text)
      sub = subtitle && clean(subtitle.text)
      @h1_context = [breadcrumb&.text&.strip, sub].compact
      "# #{title}\n\n" + (sub ? "_#{sub}#{breadcrumb ? " in #{inline_link(breadcrumb)}" : ''}_\n\n" : '')
    when 'h2', 'h3', 'h4', 'h5', 'h6'
      return '' if node['toc'] == 'false' && cls.include?('children-index--title') && false
      level = node.name[1].to_i
      if cls.include?('admonition--title')
        '' # handled by blockquote
      else
        "\n#{'#' * level} #{clean(inline(node))}\n\n"
      end
    when 'p'
      "#{inline(node).strip}\n\n"
    when 'pre'
      code = node.at_css('code') || node
      lang = code['class'].to_s[/language-(\w+)/, 1]
      "```#{lang}\n#{strip_magic_comments(code.text).chomp}\n```\n\n"
    when 'ul', 'ol'
      list(node, 0) + "\n"
    when 'blockquote'
      admonition(node)
    when 'hr'
      cls.include?('separator') ? '' : "---\n\n"
    when 'table'
      table(node)
    when 'img'
      "![#{node['alt']}](#{href(node['src'])})\n\n"
    when 'video'
      "[Video: #{node['src']}](#{href(node['src'])})\n\n"
    when 'nav'
      if cls.include?('learn-refs')
        links = node.css('a').map { |a| "- #{inline_link(a, a.css('.learn-refs--role').remove && clean(a.text))}" }
        "Learn more:\n\n#{links.join("\n")}\n\n"
      elsif cls.include?('children-index')
        links = node.css('a').map { |a| "- #{inline_link(a)}" }
        "\n## In this chapter\n\n#{links.join("\n")}\n\n"
      else
        block(node)
      end
    when 'a'
      if cls.include?('documentable-preview')
        feature_preview(node)
      elsif cls.include?('essential-feature')
        sig = clean(node.at_css('.essential-feature--signature').text)
        kind = node.at_css('.essential-feature--kind')['title']
        summary = clean(node.at_css('.essential-feature--summary')&.text.to_s)
        "- [`#{sig}`](#{href(node['href'])}) (#{kind}): #{summary}\n"
      else
        inline(node)
      end
    when 'div', 'span', 'section', 'article'
      if cls.include?('feature--param')
        param(node)
      elsif cls.include?('topic-preview')
        topic_preview(node)
      elsif cls.include?('essential-features')
        block(node) + "\n"
      elsif cls.include?('notification')
        "> #{clean(inline(node))}\n\n"
      else
        block(node)
      end
    else
      inline(node)
    end
  end

  def inline(node)
    node.children.map { |child| inline_node(child) }.join
  end

  def inline_node(node)
    return node.text.gsub(/\s+/, ' ') if node.text?
    return '' unless node.element?
    case node.name
    when 'code' then code_span(node.text)
    when 'em', 'i' then "_#{inline(node)}_"
    when 'strong', 'b' then "**#{inline(node)}**"
    when 'a' then inline_link(node)
    when 'br' then "  \n"
    when 'wbr' then ''
    when 'kbd' then code_span(node.text)
    when 'img' then "![#{node['alt']}](#{href(node['src'])})"
    else inline(node)
    end
  end

  def inline_link(a, label = nil)
    label ||= inline(a).strip
    target = a['href']
    return label if target.nil? || target.empty?
    "[#{label}](#{href(target)})"
  end

  def code_span(text)
    text.include?('`') ? "`` #{text} ``" : "`#{text}`"
  end

  # Page links point to the .md twin. Anchors are kept: they name the param or section.
  def href(url)
    return url if url =~ %r{\A[a-z]+://}i || url.start_with?('mailto:')
    return url if url.start_with?('#')
    path, anchor = url.split('#', 2)
    md = (path == '/' ? '/index' : path.chomp('/')) + '.md'
    md = path if path =~ /\.(png|jpe?g|gif|svg|webp|mp4|webm)\z/
    md += "##{anchor}" if anchor
    case @link_style
    when :absolute_md then ORIGIN + md
    when :root_md then md
    when :resolver then @resolver.call(path, anchor)
    end
  end

  def list(node, depth)
    marker_index = 0
    node.element_children.map { |li|
      next '' unless li.name == 'li'
      marker_index += 1
      marker = node.name == 'ol' ? "#{marker_index}." : '-'
      nested = li.element_children.select { |c| %w[ul ol].include?(c.name) }.map(&:remove)
      body = li.children.any? { |c| c.element? && %w[p pre div].include?(c.name) } ? block(li).strip.gsub("\n", "\n" + ' ' * (depth * 2 + 2)) : clean(inline(li))
      line = "#{'  ' * depth}#{marker} #{body}\n"
      line + nested.map { |n| list(n, depth + 1) }.join
    }.join
  end

  def admonition(node)
    title_el = node.at_css('.admonition--title')
    type = node['class'].to_s[/-(\w+)/, 1]
    title = title_el && clean(title_el.text)
    title_el&.remove
    inner = block(node).strip
    head = type ? "[!#{type.upcase}]" : nil
    head = "#{head} #{title}" if head && title && title.downcase != type.to_s.downcase
    lines = [head, inner].compact.join("\n").split("\n")
    lines.map { |l| l.empty? ? '>' : "> #{l}" }.join("\n") + "\n\n"
  end

  def table(node)
    rows = node.css('tr').map { |tr| tr.css('th, td').map { |c| clean(inline(c)).gsub('|', '\|') } }
    return '' if rows.empty?
    width = rows.map(&:size).max
    rows = rows.map { |r| r + [''] * (width - r.size) }
    out = ["| #{rows[0].join(' | ')} |", "|#{' --- |' * width}"]
    rows[1..].each { |r| out << "| #{r.join(' | ')} |" }
    out.join("\n") + "\n\n"
  end

  # One param of a feature: a heading with its signature, then optionality, types, prose.
  # A heading (not a definition list) so agents can grep "### options.target" and so the
  # skill's search can weight it.
  def param(node)
    if node['class'].include?('-response')
      types = types_text(node.at_css('.feature--param-types'))
      prose = node.at_css('.feature--param-prose')
      return "\n## Return value\n\n" + (types ? "Type: #{types}\n\n" : '') + (prose ? block(prose).strip + "\n\n" : '')
    end
    sig = clean(node.at_css('.feature--param-signature')&.text.to_s)
    tags = node.css('.feature--param-optionality .tag').map { |t| clean(t.text) }
    types = types_text(node.at_css('.feature--param-types'))
    prose = node.at_css('.feature--param-prose')
    meta = []
    meta << tags.join(', ') unless tags.empty?
    meta << "type: #{types}" if types
    out = "#### `#{sig}`\n\n"
    out << "_#{meta.join(' · ')}_\n\n" unless meta.empty?
    out << block(prose).strip << "\n\n" if prose
    out
  end

  def types_text(node)
    return nil unless node
    node.css('.types--type').map { |t| code_span(clean(t.text)) }.join(' | ')
  end

  def feature_preview(node)
    sig = clean(node.at_css('.documentable-preview--signature').text)
    kind = node.at_css('.documentable-preview--kind')['title']
    vis = clean(node.at_css('.documentable-preview--visibility')&.text.to_s)
    summary = clean(node.at_css('.documentable-preview--summary')&.text.to_s)
    vis = vis.empty? || vis == 'stable' ? '' : ", #{vis}"
    "- [`#{sig}`](#{href(node['href'])}) (#{kind}#{vis}): #{summary}\n"
  end

  def topic_preview(node)
    head = node.at_css('.topic-preview--head')
    link = head.at_css('a')
    title = link ? inline_link(link) : clean(head.text)
    prose = node.at_css('.prose')
    kids = node.css('.topic-preview--children > li').map { |li|
      a = li.at_css('a')
      a ? "- #{inline_link(a)}" : "- #{clean(li.text)}"
    }
    "\n## #{title}\n\n" + (prose ? clean(prose.text) + "\n\n" : '') + (kids.empty? ? '' : kids.join("\n") + "\n\n")
  end

  # Magic comments that only drive the site's highlighting (syntax_highlighting.js).
  # `mark:`/`mark-line` are presentation; `label:`, `result:`, `chip:` carry meaning and stay.
  def strip_magic_comments(code)
    code.gsub(/[ \t]*(?:<!--|\/\/|\/\*|#)\s*mark(?:-line|:[^\n]*?)\s*(?:-->|\*\/)?[ \t]*$/, '')
  end

  def clean(text)
    text.to_s.gsub(/\s+/, ' ').strip
  end
end
