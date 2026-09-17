Optional server bindings
========================

You backend can implement an [optional protocol](/up.protocol)
to inspect and manipulate Unpoly's rendering through simple HTTP headers.


## Existing implementations {#implementations}

If you want to use the optional protocol,
but don't want to [implement it yourself](/up.protocol),
you can use an existing library:

| Language | Framework | Protocol implementation |
|---|---|---|
| Elixir | Plug (Phoenix, …) | [`ex_unpoly`](https://github.com/webstronauts/ex_unpoly) |
| Groovy | Grace (Grails) | [`grace-unpoly`](https://github.com/grace-plugins/grace-unpoly) |
| Node.js | AdonisJS | [`adonis-unpoly`](https://github.com/batosai/adonis-unpoly) |
| PHP | Middleware (Laravel, Symfony, …) | [`php-unpoly`](https://github.com/webstronauts/php-unpoly) |
| Python | Framework-agnostic (Django, Starlette, …) | [`unpoly`](https://gitlab.com/rocketduck/python-unpoly) |
| Python | Django | [`django-unpoly`](https://github.com/jwaschkau/django-unpoly) |
| Python | Django | [`unpoly_django`](https://github.com/thinkwelltwd/unpoly_django) |
| Ruby | Ruby on Rails | [`unpoly-rails`](https://github.com/unpoly/unpoly-rails) |
| Ruby | Roda | [`roda-unpoly`](https://github.com/adam12/roda-unpoly) |
| Ruby | Rack (Hanami, Padrino, Sinatra) | [`rack-unpoly`](https://github.com/adam12/rack-unpoly) |
| Rust | Axum | [`unpoly`](https://crates.io/crates/unpoly) |

### Adding implementations to the list

If you have discovered a new implementation, please
[edit this page on GitHub](https://github.com/unpoly/unpoly/blob/master/src/unpoly/pages/server-bindings.md)
and send a pull request.

@page server-bindings
