// import registerWorker from "../worker/register-worker";

// type WORKER_NAME = "runInVM";
// const WORKER_NAME: WORKER_NAME = "runInVM";

// declare global {
//   namespace Queue {
//     interface WorkerTypes {
//       [WORKER_NAME]: {
//         name: WORKER_NAME;
//         output: {
//           boof: "wer";
//         };
//         input: {
//           code: string;
//           state: string;
//         };
//       };
//     }
//   }
// }

// registerWorker<WORKER_NAME>({
//   name: WORKER_NAME,

//   worker: async (j) => {
//     // j.data.
//     return {
//       boof: "wer",
//     };
//   },
// });

// export {};
