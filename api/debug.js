export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const info = {
    isVercel: !!process.env.VERCEL,
    hasGithubToken: !!process.env.GITHUB_TOKEN,
    hasUpstash: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    storageBackend: process.env.UPSTASH_REDIS_REST_URL
      ? 'upstash'
      : process.env.GITHUB_TOKEN
        ? 'gist'
        : 'local-tmp',
  };

  // Test GitHub token if present
  if (process.env.GITHUB_TOKEN) {
    try {
      const r = await fetch('https://api.github.com/gists?per_page=5', {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'BrightCapitalCRM/1.0',
        },
      });
      info.githubApiStatus = r.status;
      const data = await r.json();
      if (Array.isArray(data)) {
        info.githubGistCount = data.length;
        info.brightCapitalGist = data.find(g => g.description === 'Bright Capital CRM — Lead Database')?.id || null;
      } else {
        info.githubApiError = data.message || JSON.stringify(data);
      }
    } catch (err) {
      info.githubFetchError = err.message;
    }
  }

  return res.json(info);
}
