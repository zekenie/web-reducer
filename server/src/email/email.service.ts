import Mailer from "email-templates";
import { enqueue } from "../worker/queue.service";
import { SendMail } from "./email.types";

/**
 * Send an email directly. You probably want `sendMail` instead
 * Also no type guards for our templates
 */
export async function sendMailSync(config: SendMail) {
  return new Mailer({
    transport: {
      jsonTransport: true,
    },
  }).send({
    message: {
      from: config.from,
      to: config.to,
    },
    template: config.template,
    locals: config.locals,
  });
}

export async function sendMail(
  email: Email.EmailTypes[keyof Email.EmailTypes] & { to: string }
) {
  enqueue({
    name: "email",
    input: email,
  });
}
