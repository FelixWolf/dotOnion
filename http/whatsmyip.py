#This file is part of a larger, but messy script API running on a WSGI application
#While it should be self explainatory, the functions wont work unless you define them

#none setContentType(str ContentType): Sets header content type(Gets priority over writeHeader)
setContentType("text/plain")

#none writeHeader(str Key, str Value): Sets a header
writeHeader("Access-Control-Allow-Origin","*")

#none write([str|bytes] Data): Writes data to the output buffer, non-streaming
#This is behind a cloudflare and squidproxy setup, therefore HTTP_X_FORWARDED_FOR is used
# If you are on a non cloudflare/reverse proxy setup, avoid using HTTP_X_FORWARDED_FOR
# Although it isn't problematic in this scenario, it's best to avoid it when not needed.
write(environ.get("HTTP_X_FORWARDED_FOR", environ.get("REMOTE_ADDR", "Uh oh!")).encode())
