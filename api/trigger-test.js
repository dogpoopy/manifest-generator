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
    // Trigger the workflow
    const dispatchResponse = await fetch(
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

    if (dispatchResponse.status === 204) {
      // Wait a moment for the workflow to be created
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fetch the most recent workflow run
      const runsResponse = await fetch(
        `https://api.github.com/repos/${process.env.GITHUB_REPO}/actions/workflows/test-manifest.yml/runs?per_page=1`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Manifest-Generator'
          }
        }
      );

      if (runsResponse.ok) {
        const runsData = await runsResponse.json();
        
        if (runsData.workflow_runs && runsData.workflow_runs.length > 0) {
          const latestRun = runsData.workflow_runs[0];
          
          return res.status(200).json({ 
            success: true, 
            message: 'Test triggered successfully',
            runId: latestRun.id,
            runUrl: latestRun.html_url,
            status: latestRun.status,
            workflowUrl: `https://github.com/${process.env.GITHUB_REPO}/actions/workflows/test-manifest.yml`
          });
        }
      }
      
      // Fallback if we can't get the run ID
      return res.status(200).json({ 
        success: true, 
        message: 'Test triggered successfully',
        workflowUrl: `https://github.com/${process.env.GITHUB_REPO}/actions/workflows/test-manifest.yml`
      });
    } else {
      const errorData = await dispatchResponse.text();
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
