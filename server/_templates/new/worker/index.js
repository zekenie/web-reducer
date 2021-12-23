const { paramCase } = require("change-case");

module.exports = {
  prompt: ({ inquirer }) => {
    const questions = [
      {
        type: "input",
        name: "workerName",
        message: "What is the name of this worker?",
      },
      {
        type: "input",
        name: "dir",
        message: "Where is the directory",
      },
    ];
    return inquirer.prompt(questions).then((answers) => {
      const { workerName, dir } = answers;
      const path = `${paramCase(dir)}/${paramCase(workerName)}.worker.ts`;
      const absPath = `src/${path}`;
      return { ...answers, path, absPath };
    });
  },
};
