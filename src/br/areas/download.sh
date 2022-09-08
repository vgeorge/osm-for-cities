#!/bin/bash

get_abs_filename() {
  # $1 : relative filename
  echo "$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
}

SHP2JSON_BIN=$(get_abs_filename "./node_modules/.bin/shp2json")

# Create target directory
mkdir -p data/br/areas/source-zips
mkdir -p data/br/areas/shapefiles
mkdir -p data/br/areas/geojson

# Download source files for Brazil
cd data/br/areas/source-zips
curl -L -O -C - ftp://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/municipio_2020/Brasil/BR/BR_Municipios_2020.zip
curl -L -O -C - ftp://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/municipio_2020/Brasil/BR/BR_Microrregioes_2020.zip
curl -L -O -C - ftp://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/municipio_2020/Brasil/BR/BR_UF_2020.zip
echo "Expading downloaded shapefiles..."
unzip -o BR_Municipios_2020.zip -d ../shapefiles
unzip -o BR_Microrregioes_2020.zip -d ../shapefiles
unzip -o BR_UF_2020.zip -d ../shapefiles
echo "Converting to GeoJSON..."
rm -f -- ../geojson/BR_Municipios_2020.geojson
ogr2ogr ../geojson/BR_Municipios_2020.geojson ../shapefiles/BR_Municipios_2020.shp
rm -f -- ../geojson/BR_Microrregioes_2020.geojson
ogr2ogr ../geojson/BR_Microrregioes_2020.geojson ../shapefiles/BR_Microrregioes_2020.shp
rm -f -- ../geojson/BR_UF_2020.geojson
ogr2ogr ../geojson/BR_UF_2020.geojson ../shapefiles/BR_UF_2020.shp
cd -
