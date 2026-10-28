import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** Download a PDF that needs the auth header, then open the phone's viewer / share sheet. */
export async function openPdf(url: string, headers: Record<string, string>, filename: string): Promise<void> {
  const destination = new File(Paths.cache, `${filename.replace(/[^\w.-]+/g, '_')}.pdf`);
  if (destination.exists) destination.delete();
  const file = await File.createDownloadTask(url, destination, { headers }).downloadAsync();
  if (!file) throw new Error('Download did not finish');
  await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
}
