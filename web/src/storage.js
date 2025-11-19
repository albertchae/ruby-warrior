const encodeName = (name) => name.replace(/\s/, "-");
export const cacheKey = (name, skillLevel) => `rw-${encodeName(name)}-${skillLevel}`;

export const getPlayerRecord = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

export const setPlayerRecord = (key, entry) => {
  localStorage.setItem(key, JSON.stringify(entry));
};

export const getAllPlayerRecords = () => {
  const entries = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('rw-')) {
      entries.push({ key, ...JSON.parse(localStorage.getItem(key)) });
    }
  }
  return entries;
};
