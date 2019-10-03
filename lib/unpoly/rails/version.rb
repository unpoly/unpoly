module Unpoly
  module Rails
    VERSION = JSON.parse(File.read('package.json')).fetch('version')
  end
end
