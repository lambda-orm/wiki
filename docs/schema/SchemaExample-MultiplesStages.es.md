# Varios stages {#multiple-stages}

Esta página muestra un esquema con dos stages: el mismo modelo guardado en dos bases de datos distintas.

Un stage es un escenario de uso. Se pueden definir varios stages por distintos motivos, por ejemplo:

- Para ejecutar el mismo modelo de negocio en Oracle y en SQL Server y comparar su rendimiento.
- Para usar un stage como origen y otro como destino de una migración de datos.
- Para usar un stage para las lecturas y otro para las escrituras.
- Para usar un stage para el entorno de desarrollo y otro para el entorno de QA.

## Ejemplo de esquema {#schema-example}

En este esquema, `stage1` usa una base de datos MySQL con los nombres por defecto (`mapping1` está vacío), y `stage2` usa una base de datos PostgreSQL cuyas tablas y columnas tienen otros nombres (`mapping2`).
La misma consulta da el mismo resultado en ambos stages.

![esquema](images/schema3.svg)

```yaml
domain:
  entities:
    - name: Countries
      primaryKey: ["iso3"]
      uniqueKey: ["name"]
      properties:
        - name: name
          required: true
        - name: iso3
          length: 3
          required: true
      relations:
        - name: states
          type: manyToOne
          composite: true
          from: iso3
          entity: States
          to: countryCode
    - name: States
      primaryKey: ["id"]
      uniqueKey: ["countryCode", "name"]
      properties:
        - name: id
          type: integer
          required: true
        - name: name
          required: true
        - name: countryCode
          required: true
          length: 3
      relations:
        - name: country
          from: countryCode
          entity: Countries
          to: iso3
infrastructure:
  mappings:
    - name: mapping1
    - name: mapping2
      entities:
        - name: Countries
          mapping: TBL_COUNTRIES
          properties:
            - name: iso3
              mapping: ISO3
            - name: name
              mapping: NAME
        - name: States
          mapping: TBL_STATES
          properties:
            - name: id
              mapping: ID
            - name: name
              mapping: NAME
            - name: countryCode
              mapping: COUNTRY_CODE
  sources:
    - name: source1
      dialect: MySQL
      mapping: mapping1
      connection: $CNN_MYSQL
    - name: source2
      dialect: PostgreSQL
      mapping: mapping2
      connection: $CNN_POSTGRES
  stages:
    - name: stage1
      sources:
        - name: source1
    - name: stage2
      sources:
        - name: source2
```

**Variables de entorno:**

```sh
CNN_MYSQL={"host":"localhost","port":3306,"user":"test","password":"test","database":"test"}
CNN_POSTGRES={"host":"0.0.0.0","port":5433,"user":"test","password":"test","database":"test"}
```

## Laboratorios {#labs}

- [CLI - two stages](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/03-two-stages)
