"use client";

import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { createPreSignedUrlAction } from "@/lib/actions";
import { handleUploadToS3, type UploadToS3Data } from "@/lib/aws/upload";
import { createSamplePackName, isDev } from "@/lib/utils";
import { persistSamplePackDataAction } from "@/lib/actions";
import {
  type UploadFormSchema,
  uploadFormSchema,
} from "@/components/upload-form-schema";

type PreSignedUrls = Awaited<ReturnType<typeof createPreSignedUrlAction>>;

const defaultValues = {
  title: "",
  description: "",
  price: 0,
};

export default function UploadForm() {
  const form = useForm<UploadFormSchema>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues,
  });

  const formValues = form.getValues();

  const {
    mutate: createPreSignedUrls,
    data: preSignedUrls,
    isPending: isCreatingPresignedUrls,
  } = useMutation({
    mutationFn: async () =>
      await createPreSignedUrlAction(formValues.samples.length),
    onSuccess: createSignedUrlsOnSuccess,
  });

  function createSignedUrlsOnSuccess(preSignedUrls: PreSignedUrls) {
    const { zipFileSignedUrl, imageSignedUrl, samplesSignedUrls } =
      preSignedUrls;
    return uploadToS3({
      zipFileSignedUrl: zipFileSignedUrl.url,
      zipFile: formValues.zipFile[0],
      imageSignedUrl: imageSignedUrl.url,
      image: formValues.img[0],
      samplesSignedUrls: samplesSignedUrls.map(({ url }) => url),
      samples: formValues.samples,
    });
  }

  const { mutate: uploadToS3, isPending: isUploadingToS3 } = useMutation({
    mutationFn: async (data: UploadToS3Data) => await handleUploadToS3(data),
    onSuccess: () => persistData(),
  });

  const { mutate: persistData, isPending: isPersistingData } = useMutation({
    mutationFn: async () => {
      const data = getDataToPersist();
      if (!data) throw new Error();
      await persistSamplePackDataAction(data);
    },
  });

  function getDataToPersist() {
    if (!preSignedUrls) return;
    const { description, price, title } = formValues;
    const { imageSignedUrl, zipFileSignedUrl, samplesSignedUrls } =
      preSignedUrls;
    const name = createSamplePackName(title);
    const imgUrl = createPublicUrl(imageSignedUrl.key);
    const url = createPublicUrl(zipFileSignedUrl.key); // TODO we don't need this.
    const samples = samplesSignedUrls.map(({ key }) => ({
      url: createPublicUrl(key),
    }));
    return {
      samplePack: {
        price,
        title,
        description,
        name,
        imgUrl,
        url,
        key: zipFileSignedUrl.key,
      },
      samples,
    };
  }

  const imgRef = form.register("img");
  const zipRef = form.register("zipFile");
  const samplesRef = form.register("samples");

  let previewImgUrl = "";
  if (formValues.img?.length > 0) {
    previewImgUrl = URL.createObjectURL(formValues.img[0]);
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen pt-24 sm:pt-32">
      {previewImgUrl === "" ? null : (
        <Image src={previewImgUrl} alt="Preview" height={300} width={300} />
      )}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(() => createPreSignedUrls())}
          className="space-y-14 w-full pt-8 overflow-y-scroll px-1"
        >
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="Enter description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter price"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
            <FormLabel>Cover Art</FormLabel>
            <FormControl>
              <Input type="file" accept="image/*" {...imgRef} />
            </FormControl>
            <FormMessage>{form.formState.errors.img?.message}</FormMessage>
          </FormItem>

          <FormItem>
            <FormLabel>Sample Files</FormLabel>
            <FormDescription>
              Samples for display. Make sure they are tagged, they are publicly
              available.
            </FormDescription>
            <FormControl>
              <Input type="file" accept="audio/*" multiple {...samplesRef} />
            </FormControl>
            <FormMessage>{form.formState.errors.samples?.message}</FormMessage>
          </FormItem>

          <FormItem>
            <FormLabel>Sample Pack</FormLabel>
            <FormDescription>
              The file that buyers will get. It should contain all sample packs
              and any other information.
            </FormDescription>
            <FormControl>
              <Input type="file" accept="application/zip" {...zipRef} />
            </FormControl>
            <FormMessage>{form.formState.errors.zipFile?.message}</FormMessage>
          </FormItem>

          <Button type="submit">
            {isCreatingPresignedUrls
              ? "Creating..."
              : isUploadingToS3
              ? "Uploading..."
              : isPersistingData
              ? "Persisting Data..."
              : "Submit"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

function createPublicUrl(key: string) {
  if (isDev) {
    return `https://localhost.localstack.cloud:4566/noos-public-assets-v2/${key}`;
  }

  return `https://d14g83wf83qv4z.cloudfront.net/${key}`;
}
