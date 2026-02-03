import { FC } from "react";

interface FileMetadata {
  name: string;
  createdAt?: Date;
  size?: number;
  type?: string;
}

interface LocalFileListProps {
  directoryName: string;
  files: FileMetadata[] | undefined;
}

export const LocalFileList: FC<LocalFileListProps> = ({
  directoryName,
  files,
}) => {
  const formatDate = (date?: Date) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const formatSize = (bytes?: number) => {
    if (bytes === undefined) return "-";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <div className="w-full">
      <h1 className="text-xl font-heading font-bold mb-4">
        <code>{directoryName}</code>
      </h1>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Type
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Size
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Created
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {files?.map((file) => (
              <tr key={file.name} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {file.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {file.type || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatSize(file.size)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(file.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface LocalFileContentsProps {
  fileName: string;
  fileContents: string;
}

export const LocalFileContents: FC<LocalFileContentsProps> = ({
  fileName,
  fileContents,
}) => {
  return (
    <div className="w-full border border-gray-200 rounded-lg p-4">
      <h1 className="text-xl font-heading font-bold mb-4">
        <code>{fileName}</code>
      </h1>
      <pre className="bg-gray-100 p-4 rounded-lg border border-gray-200">
        <code>{fileContents}</code>
      </pre>
    </div>
  );
};
