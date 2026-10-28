/**
 * Web build: fetch the PDF with the auth header and show it in a new tab.
 * The tab is opened before the download starts, while the tap still counts as a user action;
 * a tab opened after an await is treated as a pop-up and blocked.
 */
export async function openPdf(url: string, headers: Record<string, string>, filename: string): Promise<void> {
  const tab = window.open('', '_blank');
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blobUrl = URL.createObjectURL(await response.blob());
    if (tab) {
      tab.location.href = blobUrl;
    } else {
      // pop-ups fully blocked: download the file instead
      const link = Object.assign(document.createElement('a'), { href: blobUrl, download: `${filename}.pdf` });
      link.click();
    }
  } catch (error) {
    tab?.close();
    throw error;
  }
}
