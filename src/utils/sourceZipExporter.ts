import JSZip from 'jszip';

const sourceFiles = import.meta.glob('../**/*.{ts,tsx,css,json}', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

export async function downloadSourceCodeZip(): Promise<{ fileCount: number }> {
  const zip = new JSZip();
  let fileCount = 0;

  for (const [path, content] of Object.entries(sourceFiles)) {
    zip.file(path.replace(/^\.\.\//, ''), content);
    fileCount++;
  }

  zip.file('README.txt', 'ESP32 Flasher source bundle exported from the running application.');
  fileCount++;

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'esp32-flasher-source.zip';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  return { fileCount };
}
