/**
 * Custom function to resolve file URLs for document exporters
 */
export const resolveFileUrl = async (url: string): Promise<ArrayBuffer | string> => {
  try {
    if (url.startsWith('data:')) {
      return url;
    }

    const response = await fetch(url, {
      method: 'GET',
      cache: 'force-cache',
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error('Error resolving file URL:', error);
    return new ArrayBuffer(0);
  }
};

export interface ExporterOptions {
  resolveFileUrl: typeof resolveFileUrl;
  [key: string]: unknown;
}

/**
 * Create exporter options with custom file resolution
 */
export const createExporterOptions = (additionalOptions: Record<string, unknown> = {}): ExporterOptions => {
  return {
    resolveFileUrl,
    ...additionalOptions
  };
};
