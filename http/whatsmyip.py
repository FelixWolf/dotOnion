setContentType("text/plain")
writeHeader("Access-Control-Allow-Origin","*")
write(environ.get("HTTP_X_FORWARDED_FOR", environ.get("REMOTE_ADDR", "Uh oh!")).encode())
