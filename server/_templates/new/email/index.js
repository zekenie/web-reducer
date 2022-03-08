const { paramCase } = require("change-case");

module.exports = {
  prompt: ({ inquirer }) => {
    const questions = [
      {
        type: "input",
        name: "emailName",
        message: "What is the name of this email?",
      },
      {
        type: "input",
        name: "dir",
        message: "Where is the directory",
      },
    ];
    return inquirer.prompt(questions).then((answers) => {
      const { emailName, dir } = answers;
      const path = `${paramCase(dir)}/${paramCase(emailName)}.email.ts`;
      const absPath = `src/${path}`;
      return { ...answers, path, absPath };
    });
  },
};
