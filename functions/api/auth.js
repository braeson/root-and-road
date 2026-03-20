export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    const redirect = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&scope=repo,user`;
    return Response.redirect(redirect, 302);
  }

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code
    })
  });

  const tokenData = await tokenResponse.json();

  if (tokenData.error) {
    return new Response(`Auth error: ${tokenData.error_description}`, { status: 400 });
  }

  const token = tokenData.access_token;
  const message = JSON.stringify({ token, provider: "github" });

  return new Response(`
    <!doctype html>
    <html>
    <body>
    <script>
      (function() {
        function receiveMessage() {
          window.opener.postMessage(
            'authorization:github:success:${message}',
            window.location.origin
          );
          window.close();
        }
        receiveMessage();
      })();
    </script>
    </body>
    </html>
  `, {
    headers: { "Content-Type": "text/html" }
  });
}