import sftpClient from "ssh2-sftp-client";

let sftp = new sftpClient();
let isConnected = false;
let files = [];

export const setConnected = (status) => {
  isConnected = status;
};

export const setFiles = (fileList) => {
  files = fileList;
};

export const getIsConnected = () => {
  return isConnected;
};

export const getFiles = () => {
  return files;
};

export const connectFTP = async (ftpSettings) => {
  try {
    await sftp.connect({
      host: ftpSettings.host,
      port: ftpSettings.port,
      username: ftpSettings.username,
      password: ftpSettings.password
    });
    setConnected(true);
  } catch (error) {
    setConnected(false);
    throw new Error("Failed to connect to FTP Server");
  }
};

export const disconnectFTP = async () => {
  try {
    await sftp.end();
    setConnected(false);
  } catch (error) {
    setConnected(false);
  }
};
let currentDir = "/";

export const setCurrentDir = (dir) => {
  currentDir = dir;
};

export const getCurrentDir = () => {
  return currentDir;
};

export const listFilesAndDirectories = async (remoteDir = "/") => {
  if (!isConnected) {
    return;
  }
  try {
    const fileObjects = await sftp.list(remoteDir);
    const files = [];
    for (const file of fileObjects) {
      files.push(file);
    }
    setFiles(files);
  } catch (error) {
    console.log(error);
  }
};
