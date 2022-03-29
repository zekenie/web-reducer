import Mailer from "email-templates";
import { enqueue } from "../worker/queue.service";
import { SendMail } from "./email.types";
import * as testInternalService from "../test-internals/test-internals.service";

/**
 * Send an email directly. You probably want `sendMail` instead
 * Also no type guards for our templates
 */
export async function sendMailSync(config: SendMail) {
  const msg = {
    message: {
      from: config.from,
      to: config.to,
    },
    template: config.template,
    locals: config.locals,
  };
  testInternalService.add("email", config);
  return new Mailer({
    transport: {
      jsonTransport: true,
    },
  }).send(msg);
}

export async function sendMail(
  email: Email.EmailTypes[keyof Email.EmailTypes] & { to: string }
) {
  enqueue({
    name: "email",
    input: email,
  });
}
