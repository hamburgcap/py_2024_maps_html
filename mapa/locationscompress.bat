
aws s3 cp locations_resultados.json s3://rota-arremate-static/mapa/locations_resultados.json --content-type "application/json"
aws s3 cp locations.json s3://rota-arremate-static/mapa/locations.json --content-type "application/json"
aws cloudfront create-invalidation --distribution-id EMXNE5BT9PKFF --paths "/*"