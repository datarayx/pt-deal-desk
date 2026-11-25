-- Keep uploaded branding in formats supported by both ExcelJS and React-PDF.
update storage.buckets
set allowed_mime_types = array['image/png', 'image/jpeg']
where id = 'branding';

