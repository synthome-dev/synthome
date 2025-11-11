import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea, TextareaForm } from "@/components/ui/textarea";
import { Form, Formik } from "formik";

export const PromptEditor = ({
  prompt,
  onSave,
}: {
  prompt: string;
  onSave: (prompt: string) => void;
}) => {
  return (
    <Formik
      initialValues={{
        prompt: prompt || "",
      }}
      onSubmit={(values) => {
        onSave(values.prompt);
      }}
    >
      {({ values }) => (
        <Form>
          <div>
            <Label>Prompt</Label>
            <TextareaForm
              className="mb-2 textarea-auto-resize h-auto"
              name="prompt"
            />
            <Button type="submit">Save Changes</Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};
