const { pascalCase, paramCase } = require("change-case");

module.exports = {
  prompt: ({ inquirer }) => {
    const questions = [
      {
        type: "input",
        name: "modalName",
        message: "What is the name of this modal?",
      },
      {
        type: "input",
        name: "dir",
        message: "Where is the directory",
      },
    ];
    return inquirer.prompt(questions).then((answers) => {
      const { modalName, dir } = answers;
      const path = `${paramCase(dir)}/${pascalCase(modalName)}Modal.tsx`;
      const absPath = `src/${path}`;
      return { ...answers, path, absPath };
    });
  },
};
