export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { romManifest, romBranch, manifestContent } = req.body;

  if (!romManifest || !romBranch || !manifestContent) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${process.env.GITHUB_REPO}/actions/workflows/test-manifest.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Manifest-Generator'
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            rom_manifest: romManifest,
            rom_branch: romBranch,
            manifest_content: manifestContent
          }
        })
      }
    );

    if (response.status === 204) {
      return res.status(200).json({ 
        success: true, 
        message: 'Test triggered successfully',
        actionsUrl: `https://github.com/${process.env.GITHUB_REPO}/actions/workflows/test-manifest.yml`
      });
    } else {
      const errorData = await response.text();
      console.error('GitHub API Error:', errorData);
      return res.status(500).json({ 
        error: 'Failed to trigger test',
        details: errorData
      });
    }
  } catch (error) {
    console.error('Error triggering workflow:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}
