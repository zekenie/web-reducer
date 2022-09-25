import { useFetcher, useLoaderData } from "@remix-run/react";
import { Label, Textarea, TextInput } from "flowbite-react";
import { useCallback } from "react";
import type { HookDetail } from "~/remote/hook-client.server";

function DetailsForm() {
  const hook = useLoaderData<HookDetail>();
  const fetcher = useFetcher();
  const updateField = useCallback(
    (field: "name" | "description", value: string) => {
      fetcher.submit(
        { [field]: value },
        { method: "post", action: `/hooks/${hook.id}/update` }
      );
    },
    [hook, fetcher]
  );

  return (
    <>
      <div>
        <div className="mb-2 block">
          <Label htmlFor="name">Name</Label>
        </div>
        <TextInput
          disabled={fetcher.state === "submitting"}
          onBlur={(e) => updateField("name", e.currentTarget.value)}
          id="name"
          name="name"
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              updateField("name", e.currentTarget.value);
              return;
            }
            e.currentTarget.value = slugify(e.currentTarget.value + e.key);

            e.preventDefault();
            return false;
          }}
          defaultValue={hook.name}
        />
      </div>
      <div>
        <div className="mb-2 block">
          <Label htmlFor="description">Description</Label>
        </div>
        <Textarea
          defaultValue={hook.description}
          disabled={fetcher.state === "submitting"}
          id="description"
          onBlur={(e) => updateField("description", e.currentTarget.value)}
          name="description"
          placeholder="What is this for?"
          rows={4}
        />
      </div>
    </>
  );
}

export default DetailsForm;

const slugify = (text: string) =>
  text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "-")
    .replace(/--+/g, "-");
