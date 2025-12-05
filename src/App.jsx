import React, { useState } from 'react';
import { Plus, Trash2, Copy, Download, Play } from 'lucide-react';

export default function ManifestGenerator() {
  const [remotes, setRemotes] = useState([]);
  
  const [device, setDevice] = useState({ path: '', name: '', remote: '', branch: '', commented: false });
  const [deviceCommon, setDeviceCommon] = useState({ path: '', name: '', remote: '', branch: '', commented: false, enabled: false });
  const [vendor, setVendor] = useState({ path: '', name: '', remote: '', branch: '', commented: false });
  const [vendorCommon, setVendorCommon] = useState({ path: '', name: '', remote: '', branch: '', commented: false, enabled: false });
  const [kernel, setKernel] = useState({ path: '', name: '', remote: '', branch: '', commented: false });
  
  const [otherProjects, setOtherProjects] = useState([]);
  const [removeProjects, setRemoveProjects] = useState([]);
  const [copied, setCopied] = useState(false);
  
  // Test feature states
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [romManifest, setromManifest] = useState('');
  const [romBranch, setRomBranch] = useState('');

  const addRemote = () => {
    setRemotes([...remotes, { name: '', fetch: '' }]);
  };

  const updateRemote = (index, field, value) => {
    const updated = [...remotes];
    updated[index][field] = value;
    setRemotes(updated);
  };

  const deleteRemote = (index) => {
    setRemotes(remotes.filter((_, i) => i !== index));
  };

  const addOtherProject = () => {
    setOtherProjects([...otherProjects, { path: '', name: '', remote: '', branch: '', commented: false }]);
  };

  const updateOtherProject = (index, field, value) => {
    const updated = [...otherProjects];
    updated[index][field] = value;
    setOtherProjects(updated);
  };

  const deleteOtherProject = (index) => {
    setOtherProjects(otherProjects.filter((_, i) => i !== index));
  };

  const addRemoveProject = () => {
    setRemoveProjects([...removeProjects, { name: '' }]);
  };

  const updateRemoveProject = (index, value) => {
    const updated = [...removeProjects];
    updated[index].name = value;
    setRemoveProjects(updated);
  };

  const deleteRemoveProject = (index) => {
    setRemoveProjects(removeProjects.filter((_, i) => i !== index));
  };

  const generateManifest = () => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<manifest>\n\n';
    
    if (remotes.length > 0) {
      xml += ' <!-- Remotes -->\n';
      remotes.forEach(remote => {
        if (remote.name && remote.fetch) {
          xml += `    <remote name="${remote.name}"\n`;
          xml += `            fetch="${remote.fetch}" />\n\n`;
        }
      });
    }

    xml += ' <!-- Device Trees -->\n';
    
    if (device.path && device.name) {
      const line = ` <project path="${device.path}" name="${device.name}"${device.remote ? ` remote="${device.remote}"` : ''}${device.branch ? ` revision="${device.branch}"` : ''} />`;
      xml += device.commented ? ` <!--${line} -->\n` : `${line}\n`;
    }
    
    if (deviceCommon.enabled && deviceCommon.path && deviceCommon.name) {
      const line = ` <project path="${deviceCommon.path}" name="${deviceCommon.name}"${deviceCommon.remote ? ` remote="${deviceCommon.remote}"` : ''}${deviceCommon.branch ? ` revision="${deviceCommon.branch}"` : ''} />`;
      xml += deviceCommon.commented ? ` <!--${line} -->\n` : `${line}\n`;
    }

    xml += '\n <!-- Vendor Trees -->\n';
    
    if (vendor.path && vendor.name) {
      const line = ` <project path="${vendor.path}" name="${vendor.name}"${vendor.remote ? ` remote="${vendor.remote}"` : ''}${vendor.branch ? ` revision="${vendor.branch}"` : ''} />`;
      xml += vendor.commented ? ` <!--${line} -->\n` : `${line}\n`;
    }
    
    if (vendorCommon.enabled && vendorCommon.path && vendorCommon.name) {
      const line = ` <project path="${vendorCommon.path}" name="${vendorCommon.name}"${vendorCommon.remote ? ` remote="${vendorCommon.remote}"` : ''}${vendorCommon.branch ? ` revision="${vendorCommon.branch}"` : ''} />`;
      xml += vendorCommon.commented ? ` <!--${line} -->\n` : `${line}\n`;
    }

    xml += '\n <!-- Kernel -->\n';
    
    if (kernel.path && kernel.name) {
      const line = ` <project path="${kernel.path}" name="${kernel.name}"${kernel.remote ? ` remote="${kernel.remote}"` : ''}${kernel.branch ? ` revision="${kernel.branch}"` : ''} />`;
      xml += kernel.commented ? ` <!--${line} -->\n` : `${line}\n`;
    }

    if (otherProjects.length > 0) {
      xml += '\n <!-- Other Projects -->\n';
      otherProjects.forEach(project => {
        if (project.path && project.name) {
          const line = ` <project path="${project.path}" name="${project.name}"${project.remote ? ` remote="${project.remote}"` : ''}${project.branch ? ` revision="${project.branch}"` : ''} />`;
          xml += project.commented ? ` <!--${line} -->\n` : `${line}\n`;
        }
      });
    }

    if (removeProjects.length > 0) {
      xml += '\n <!-- Remove Projects -->\n';
      removeProjects.forEach(rp => {
        if (rp.name) {
          xml += ` <remove-project name="${rp.name}" />\n`;
        }
      });
    }

    xml += '\n</manifest>';
    return xml;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateManifest());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadManifest = () => {
    const element = document.createElement('a');
    const file = new Blob([generateManifest()], { type: 'text/xml' });
    element.href = URL.createObjectURL(file);
    element.download = 'local_manifest.xml';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const testManifest = async () => {
    if (!romManifest || !romBranch) {
      alert('Please enter ROM manifest and branch');
      return;
    }

    const manifest = generateManifest();
    
    // Basic validation
    if (!manifest.includes('<project') && !manifest.includes('<remove-project')) {
      alert('Please add at least one project to test');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/trigger-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          romManifest,
          romBranch,
          manifestContent: manifest
        })
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult({
          success: true,
          message: 'Test started successfully! Check the results on GitHub Actions.',
          actionsUrl: data.actionsUrl
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to start test'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Network error: ' + error.message
      });
    } finally {
      setTesting(false);
    }
  };

  const ProjectInput = ({ project, setProject, title, color, showEnable = false }) => (
    <div className={`bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold text-${color}-300`}>{title}</h3>
        {showEnable && (
          <label className="flex items-center gap-2 text-white cursor-pointer">
            <input
              type="checkbox"
              checked={project.enabled}
              onChange={(e) => setProject({ ...project, enabled: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm">Enable</span>
          </label>
        )}
      </div>
      <div className={`space-y-3 ${showEnable && !project.enabled ? 'opacity-50' : ''}`}>
        <input
          type="text"
          placeholder="Path (e.g., device/xiaomi/apollo)"
          value={project.path}
          onChange={(e) => setProject({ ...project, path: e.target.value })}
          disabled={showEnable && !project.enabled}
          className="w-full bg-white/10 text-white placeholder-gray-400 px-3 py-2 rounded border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <input
          type="text"
          placeholder="Name (e.g., android_device_xiaomi_apollo)"
          value={project.name}
          onChange={(e) => setProject({ ...project, name: e.target.value })}
          disabled={showEnable && !project.enabled}
          className="w-full bg-white/10 text-white placeholder-gray-400 px-3 py-2 rounded border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <input
          type="text"
          placeholder="Remote Name"
          value={project.remote}
          onChange={(e) => setProject({ ...project, remote: e.target.value })}
          disabled={showEnable && !project.enabled}
          className="w-full bg-white/10 text-white placeholder-gray-400 px-3 py-2 rounded border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <input
          type="text"
          placeholder="Branch (e.g., statix)"
          value={project.branch}
          onChange={(e) => setProject({ ...project, branch: e.target.value })}
          disabled={showEnable && !project.enabled}
          className="w-full bg-white/10 text-white placeholder-gray-400 px-3 py-2 rounded border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <label className="flex items-center gap-2 text-white cursor-pointer">
          <input
            type="checkbox"
            checked={project.commented}
            onChange={(e) => setProject({ ...project, commented: e.target.checked })}
            disabled={showEnable && !project.enabled}
            className="w-4 h-4"
          />
          <span className="text-sm">Comment out (disable in manifest)</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Create your local_manifest.xml for ROM building</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Remotes */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Remotes</h2>
                <button onClick={addRemote} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition text-sm">
                  <Plus size={16} /> Add
                </button>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {remotes.map((remote, idx) => (
                  <div key={idx} className="bg-white/5 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-blue-300 text-sm font-medium">Remote #{idx + 1}</span>
                      <button onClick={() => deleteRemote(idx)} className="text-red-400 hover:text-red-300">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Remote Name"
                      value={remote.name}
                      onChange={(e) => updateRemote(idx, 'name', e.target.value)}
                      className="w-full bg-white/10 text-white placeholder-gray-400 px-3 py-2 text-sm rounded border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Fetch URL (e.g., https://github.com/user/)"
                      value={remote.fetch}
                      onChange={(e) => updateRemote(idx, 'fetch', e.target.value)}
                      className="w-full bg-white/10 text-white placeholder-gray-400 px-3 py-2 text-sm rounded border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Main Trees */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Main Trees</h2>
              
              <ProjectInput project={device} setProject={setDevice} title="Device Tree" color="green" />
              <ProjectInput project={deviceCommon} setProject={setDeviceCommon} title="Device Common (Optional)" color="green" showEnable={true} />
              <ProjectInput project={vendor} setProject={setVendor} title="Vendor Tree" color="purple" />
              <ProjectInput project={vendorCommon} setProject={setVendorCommon} title="Vendor Common (Optional)" color="purple" showEnable={true} />
              <ProjectInput project={kernel} setProject={setKernel} title="Kernel" color="orange" />
            </div>

            {/* Other Projects */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Other Projects</h2>
                <button onClick={addOtherProject} className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-2 rounded-lg transition text-sm">
                  <Plus size={16} /> Add
                </button>
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {otherProjects.map((project, idx) => (
                  <div key={idx} className="bg-white/5 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-cyan-300 text-sm font-medium">Project #{idx + 1}</span>
                      <button onClick={() => deleteOtherProject(idx)} className="text-red-400 hover:text-red-300">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Path (e.g., vendor/hardware/xiaomi)"
                      value={project.path}
                      onChange={(e) => updateOtherProject(idx, 'path', e.target.value)}
                      className="w-full bg-white/10 text-white placeholder-gray-400 px-3 py-2 rounded border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <input
                      type="text"
                      placeholder="Name (e.g., hardware_xiaomi)"
                      value={project.name}
                      onChange={(e) => updateOtherProject(idx, 'name', e.target.value)}
                      className="w-full bg-white/10 text-white placeholder-gray-400 px-3 py-2 rounded border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <input
                      type="text"
                      placeholder="Remote (e.g., hubgit)"
                      value={project.remote}
                      onChange={(e) => updateOtherProject(idx, 'remote', e.target.value)}
                      className="w-full bg-white/10 text-white placeholder-gray-400 px-3 py-2 rounded border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <input
                      type="text"
                      placeholder="Branch (e.g., udc)"
                      value={project.branch}
                      onChange={(e) => updateOtherProject(idx, 'branch', e.target.value)}
                      className="w-full bg-white/10 text-white placeholder-gray-400 px-3 py-2 rounded border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <label className="flex items-center gap-2 text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={project.commented}
                        onChange={(e) => updateOtherProject(idx, 'commented', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Comment out (disable in manifest)</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Remove Projects */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Remove Projects</h2>
                <button onClick={addRemoveProject} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition text-sm">
                  <Plus size={16} /> Add
                </button>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {removeProjects.map((rp, idx) => (
                  <div key={idx} className="bg-white/5 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-red-300 text-sm font-medium">Remove #{idx + 1}</span>
                      <button onClick={() => deleteRemoveProject(idx)} className="text-red-400 hover:text-red-300">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Project name (e.g., platform/external/libcxx)"
                      value={rp.name}
                      onChange={(e) => updateRemoveProject(idx, e.target.value)}
                      className="w-full bg-white/10 text-white placeholder-gray-400 px-3 py-2 text-sm rounded border border-white/20 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Test Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4">Test Your Manifest</h2>
              <p className="text-gray-300 text-sm mb-4">
                Test if your manifest works with your target ROM source
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="ROM manifest URL (e.g., https://github.com/LineageOS/android.git)"
                  value={romManifest}
                  onChange={(e) => setromManifest(e.target.value)}
                  className="w-full bg-white/10 text-white placeholder-gray-400 px-3 py-2 rounded border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="ROM Branch (e.g., lineage-21.0)"
                  value={romBranch}
                  onChange={(e) => setRomBranch(e.target.value)}
                  className="w-full bg-white/10 text-white placeholder-gray-400 px-3 py-2 rounded border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={testManifest}
                  disabled={testing}
                  className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-500 text-white px-4 py-2 rounded-lg transition"
                >
                  {testing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Testing...
                    </>
                  ) : (
                    <>
                      <Play size={18} /> Test Manifest
                    </>
                  )}
                </button>
              </div>
              
              {testResult && (
                <div className={`mt-4 p-4 rounded-lg ${testResult.success ? 'bg-green-500/20 border border-green-500' : 'bg-red-500/20 border border-red-500'}`}>
                  <p className="text-white text-sm mb-2">{testResult.message}</p>
                  {testResult.success && testResult.actionsUrl && (
                    <a
                      href={testResult.actionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 text-sm underline"
                    >
                      View Test Results →
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Output Section */}
          <div className="lg:sticky lg:top-6 h-fit">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Generated Manifest</h2>
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg transition text-sm"
                  >
                    <Copy size={16} /> {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={downloadManifest}
                    className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded-lg transition text-sm"
                  >
                    <Download size={16} /> Download
                  </button>
                </div>
              </div>
              <pre className="bg-slate-950 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono max-h-[calc(100vh-12rem)] overflow-y-auto border border-green-500/30">
                {generateManifest()}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
