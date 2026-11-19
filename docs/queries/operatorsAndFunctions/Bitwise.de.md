# Bitweise Operatoren {#bitwise-operators}

Bitweise Operatoren arbeiten auf der Binärdarstellung ganzzahliger Werte.

!!! note "Zu den Beispielen"
    Die Beispiele laufen gegen die Entität `Countries` des Beispielschemas für Länder. Jedes zeigt die Abfrage, das Ergebnis, das sie auf der Testdatenbank geliefert hat, und die SQL-Anweisung, die λORM für MySQL erzeugt hat. Andere Datenbank-Engines erhalten ihre eigene Übersetzung; um die für Ihre Datenquelle erzeugte Anweisung zu sehen, verwenden Sie [`orm.plan`](../Metadata.md).

!!! note "Ergebnisse auf MySQL"
    MySQL wertet bitweise Operationen als vorzeichenlose 64-Bit-Ganzzahlen aus. Der Längengrad von Brasilien ist -55, daher sind mehrere der folgenden Ergebnisse sehr große Zahlen.

## Übersicht {#summary}

| Operator | Beschreibung |
|---|---|
| `~` | Bitweises NOT |
| `&` | Bitweises AND |
| `|` | Bitweises OR |
| `^` | Bitweises XOR (exklusives OR); dies ist keine Potenzierung, verwenden Sie dafür `**` |
| `<<` | Linksverschiebung |
| `>>` | Rechtsverschiebung |

## Bitweises NOT (`~`) {#bitwise-not}

Invertiert alle Bits von `a`. Operanden und Ergebnis sind Zahlen.

**Syntax:** `~a`

```typescript
Countries.filter(p=> p.iso3=="BRA").first(p=> {result: ~ p.longitude })
```

**Ergebnis:** `[{"result":54}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT ~ c.longitude AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
ORDER BY result asc
LIMIT 0,1
```

## Bitweises AND (`&`) {#bitwise-and}

Jedes Bit des Ergebnisses ist 1, wenn die entsprechenden Bits von `a` und `b` beide 1 sind. Operanden und Ergebnis sind Zahlen.

**Syntax:** `a & b`

```typescript
Countries.filter(p=> p.iso3=="BRA").first(p=> {result: p.longitude & 1 })
```

**Ergebnis:** `[{"result":1}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT c.longitude & 1 AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
ORDER BY result asc
LIMIT 0,1
```

## Bitweises OR (`|`) {#bitwise-or}

Jedes Bit des Ergebnisses ist 1, wenn das entsprechende Bit von `a` oder von `b` 1 ist. Operanden und Ergebnis sind Zahlen.

**Syntax:** `a | b`

```typescript
Countries.filter(p=> p.iso3=="BRA").first(p=> {result: p.longitude | 1 })
```

**Ergebnis:** `[{"result":18446744073709552000}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT c.longitude | 1 AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
ORDER BY result asc
LIMIT 0,1
```

## Bitweises XOR (`^`) {#bitwise-xor}

Jedes Bit des Ergebnisses ist 1, wenn sich die entsprechenden Bits von `a` und `b` unterscheiden. Operanden und Ergebnis sind Zahlen.

**Syntax:** `a ^ b`

```typescript
Countries.filter(p=> p.iso3=="BRA").first(p=> {result: p.longitude ^ 1 })
```

**Ergebnis:** `[{"result":18446744073709552000}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT c.longitude ^ 1 AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
ORDER BY result asc
LIMIT 0,1
```

## Linksverschiebung (`<<`) {#left-shift}

Verschiebt die Bits von `a` um `b` Stellen nach links. Operanden und Ergebnis sind Zahlen.

**Syntax:** `a << b`

```typescript
Countries.filter(p=> p.iso3=="BRA").first(p=> {result: p.longitude << 1 })
```

**Ergebnis:** `[{"result":18446744073709552000}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT c.longitude << 1 AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
ORDER BY result asc
LIMIT 0,1
```

## Rechtsverschiebung (`>>`) {#right-shift}

Verschiebt die Bits von `a` um `b` Stellen nach rechts. Operanden und Ergebnis sind Zahlen.

**Syntax:** `a >> b`

```typescript
Countries.filter(p=> p.iso3=="BRA").first(p=> {result: p.longitude >> 1 })
```

**Ergebnis:** `[{"result":9223372036854776000}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT c.longitude >> 1 AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
ORDER BY result asc
LIMIT 0,1
```

## Datenbankunterstützung {#database-support}

!!! warning "Unterschiede zwischen Datenbank-Engines"
    - **Oracle**: `&`, `|` und `^` werden in `BITAND`, `BITOR` und `BITXOR` übersetzt.
    - **PostgreSQL**: `^` wird in den Operator `#` (XOR) übersetzt.
    - **MongoDB**: `&`, `|`, `^` und `~` werden in `$bitAnd`, `$bitOr`, `$bitXor` und `$bitNot` übersetzt (MongoDB 6.3
      oder neuer).
    - **MongoDB** und **Oracle**: `<<` und `>>` sind eine Multiplikation oder Division durch eine Zweierpotenz.
    - Bei einer negativen Zahl verschiebt jede Engine auf ihre Weise: arithmetisch bei PostgreSQL, Oracle und MongoDB
      (`-21 >> 2` ist `-6`), über vorzeichenlose Ganzzahlen bei MySQL, MariaDB und SQL Server.
