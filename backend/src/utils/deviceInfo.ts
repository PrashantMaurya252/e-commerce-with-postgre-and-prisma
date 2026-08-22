
import { UAParser } from 'ua-parser-js';

export function getDeviceName(userAgent: string): string {
  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  return `${browser.name || 'Unknown'} on ${os.name || 'Unknown'}`;
}