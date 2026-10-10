import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import prettyBytes from 'pretty-bytes';
import pMap from 'p-map';

import { getDuration } from '../ffmpeg';
import { readFileSize } from '../util';
import { formatDuration } from '../util/duration';

const { basename } = window.require('node:path');

interface OutputFileInfo {
  path: string,
  size: number | undefined,
  duration: number | undefined,
}

async function readOutputFileInfo(path: string): Promise<OutputFileInfo> {
  const [size, duration] = await Promise.all([
    readFileSize(path).catch((err: unknown) => { console.warn('Unable to read output file size', path, err); return undefined; }),
    getDuration(path).catch((err: unknown) => { console.warn('Unable to read output file duration', path, err); return undefined; }),
  ]);
  return { path, size, duration };
}

const cellStyle = { padding: '.1em .5em', whiteSpace: 'nowrap' } as const;
const numericCellStyle = { ...cellStyle, textAlign: 'right' } as const;

const formatSize = (size: number | undefined) => (size != null ? prettyBytes(size) : '-');
const formatDur = (duration: number | undefined) => (duration != null ? formatDuration({ seconds: duration, shorten: true }) : '-');

function sumDefined(values: (number | undefined)[]) {
  const defined = values.filter((v): v is number => v != null);
  return defined.length > 0 ? defined.reduce((acc, v) => acc + v, 0) : undefined;
}

export default function OutputFilesInfo({ paths }: { paths: string[] }) {
  const { t } = useTranslation();
  const [infos, setInfos] = useState<OutputFileInfo[]>();

  useEffect(() => {
    let canceled = false;
    (async () => {
      const result = await pMap(paths, readOutputFileInfo, { concurrency: 5 });
      if (!canceled) setInfos(result);
    })();
    return () => { canceled = true; };
  }, [paths]);

  if (paths.length === 0) return null;

  if (infos == null) {
    return <div style={{ opacity: 0.6, margin: '.5em 0' }}>{t('Loading output file info...')}</div>;
  }

  return (
    <div style={{ maxHeight: '15em', overflowY: 'auto', margin: '.5em 0 1em 0' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ opacity: 0.7, textAlign: 'left' }}>
            <th style={cellStyle}>{t('Output file')}</th>
            <th style={numericCellStyle}>{t('Duration')}</th>
            <th style={numericCellStyle}>{t('File size')}</th>
          </tr>
        </thead>
        <tbody>
          {infos.map(({ path, size, duration }) => (
            <tr key={path}>
              <td style={{ ...cellStyle, whiteSpace: 'normal', wordBreak: 'break-all' }} title={path}>{basename(path)}</td>
              <td style={numericCellStyle}>{formatDur(duration)}</td>
              <td style={numericCellStyle}>{formatSize(size)}</td>
            </tr>
          ))}
        </tbody>
        {infos.length > 1 && (
          <tfoot>
            <tr style={{ fontWeight: 'bold' }}>
              <td style={cellStyle}>{t('Total ({{count}} files)', { count: infos.length })}</td>
              <td style={numericCellStyle}>{formatDur(sumDefined(infos.map((i) => i.duration)))}</td>
              <td style={numericCellStyle}>{formatSize(sumDefined(infos.map((i) => i.size)))}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
