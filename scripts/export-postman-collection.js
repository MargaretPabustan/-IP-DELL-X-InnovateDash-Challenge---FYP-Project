const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const collectionDir = path.resolve(__dirname, '..', 'postman', 'collections', 'Dell Lead Management API');
const outputFile = path.resolve(__dirname, '..', 'postman', 'collections', 'Dell Lead Management API.postman_collection.json');

function readYaml(filePath) {
  return YAML.parse(fs.readFileSync(filePath, 'utf8'));
}

const definitionFile = path.join(collectionDir, '.resources', 'definition.yaml');
const definition = readYaml(definitionFile);
const collectionName = definition.name || 'Dell Lead Management API';
const collectionId = definition.id || undefined;
const schema = definition.schema || 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json';

function getRequestItem(filePath) {
  const doc = readYaml(filePath);
  const item = {
    name: doc.name || path.basename(filePath, '.request.yaml'),
    request: {
      method: String(doc.method || 'GET'),
      header: Array.isArray(doc.headers)
        ? doc.headers.map((h) => ({ key: h.key || '', value: h.value || '' }))
        : [],
      url: doc.url || '',
    },
    response: [],
  };

  if (doc.body) {
    const raw = doc.body.content || '';
    item.request.body = {
      mode: 'raw',
      raw,
      options: {
        raw: {
          language: doc.body.type || 'json',
        },
      },
    };

    const hasContentType = item.request.header.some(
      (h) => h.key.toLowerCase() === 'content-type'
    );
    if (!hasContentType) {
      item.request.header.push({
        key: 'Content-Type',
        value: doc.body.type === 'json' ? 'application/json' : '',
      });
    }
  }

  if (Array.isArray(doc.scripts)) {
    item.event = doc.scripts.map((script) => {
      const listen = script.type === 'beforeRequest' ? 'prerequest' : script.type === 'afterResponse' ? 'test' : script.type;
      const exec = String(script.code || '').split(/\r?\n/);
      return {
        listen,
        script: {
          type: script.language || 'text/javascript',
          exec,
        },
      };
    });
  }

  return item;
}

function getFolderOrder(folderPath, fileNames) {
  return fileNames
    .map((fileName) => readYaml(path.join(folderPath, fileName)).order || 0)
    .reduce((min, order) => (order < min ? order : min), Number.MAX_SAFE_INTEGER);
}

const folderEntries = fs
  .readdirSync(collectionDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory() && dirent.name !== '.resources')
  .map((dirent) => {
    const folderPath = path.join(collectionDir, dirent.name);
    const fileNames = fs
      .readdirSync(folderPath)
      .filter((fileName) => fileName.endsWith('.request.yaml'));
    return {
      name: dirent.name,
      path: folderPath,
      order: getFolderOrder(folderPath, fileNames),
      files: fileNames
        .map((fileName) => ({
          fileName,
          order: readYaml(path.join(folderPath, fileName)).order || 0,
        }))
        .sort((a, b) => a.order - b.order || a.fileName.localeCompare(b.fileName, 'en', { sensitivity: 'base' }))
        .map((entry) => entry.fileName),
    };
  })
  .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));

const collectionItems = folderEntries.map((folder) => ({
  name: folder.name,
  item: folder.files.map((fileName) => getRequestItem(path.join(folder.path, fileName))),
}));

const collection = {
  info: {
    name: collectionName,
    _postman_id: collectionId,
    schema,
  },
  item: collectionItems,
};

fs.writeFileSync(outputFile, JSON.stringify(collection, null, 2), 'utf8');
console.log('Exported collection file:', outputFile);
