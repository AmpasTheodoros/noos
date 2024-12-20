"use client";

export type UploadToS3Data = {
  zipFileSignedUrl: string;
  zipFile: File;
  imageSignedUrl: string;
  image: File;
  samplesSignedUrls: string[];
  samples: FileList;
};

export async function handleUploadToS3({
  zipFileSignedUrl,
  zipFile,
  imageSignedUrl,
  image,
  samplesSignedUrls,
  samples,
}: UploadToS3Data) {
  try {
    const zipPromise = uploadFile(zipFileSignedUrl, zipFile);
    const imgPromise = uploadFile(imageSignedUrl, image);
    const promises = [zipPromise, imgPromise];
    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i];
      const sampleUrl = samplesSignedUrls[i];
      promises.push(uploadFile(sampleUrl, sample));
    }

    await Promise.all(promises);
    console.log("All files uploaded successfully.");
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw new Error();
  }
}

async function uploadFile(url: string, file: File) {
  const response = await fetch(url, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to upload file to ${url}`);
  }

  console.info(`Successfully uploaded ${file.name} to ${url}`);
}
