import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const postId = formData.get('postId') as string | null;
    const name = formData.get('name') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    // Convertir le fichier en Buffer pour Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Nom de fichier propre : "cv_NomCandidat_postId"
    const safeName = (name ?? 'candidat').replace(/\s+/g, '_').toLowerCase();
    const publicId = `cv_${safeName}_${postId ?? Date.now()}`;

    // Upload vers Cloudinary
    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: 'cv_applications',
              resource_type: 'auto', // gère PDF et images
              public_id: publicId,
              overwrite: true,
            },
            (error, uploadResult) => {
              if (error || !uploadResult) {
                reject(error ?? new Error('Résultat Cloudinary vide'));
              } else {
                resolve(uploadResult as { secure_url: string; public_id: string });
              }
            },
          )
          .end(buffer);
      },
    );

    // On retourne seulement ce dont le client a besoin
    return NextResponse.json({
      secure_url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error: any) {
    console.error('Erreur Upload Cloudinary:', error);
    return NextResponse.json(
      { error: error?.message ?? "Échec de l'upload" },
      { status: 500 },
    );
  }
}