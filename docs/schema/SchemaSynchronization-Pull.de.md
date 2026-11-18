# Pull {#pull}

Diese Seite erklärt pull, das die Schema-Datei mit der Struktur der Quellen (Datenbanken) eines Stages aktualisiert: was erhalten bleibt, den CLI-Befehl `lambdaorm pull` und die Methode `orm.stage.pull()`.

## Was pull erhält {#what-pull-keeps}

Pull liest die Tabellen und Spalten der Datenbanken und führt sie im Schema zusammen: Neue Tabellen werden zu Entitäten, neue Spalten zu Eigenschaften, und die Mappings werden aktualisiert. Pull ändert die Datenbanken nicht.
Standardmäßig entfernt es außerdem die Entitäten, Eigenschaften und Beziehungen aus dem Schema, die nicht mehr in der Datenbank vorhanden sind
(`orm.stage.pull({ stage, removeEntities: false, removeProperties: false, removeRelations: false })` behält sie bei).
Es kann auf ein bestehendes Schema angewendet werden: Was von Hand geschrieben wurde, bleibt erhalten, zum Beispiel

- von Hand gewählte Beziehungsnamen und `weak`-Beziehungen zwischen Quellen (die in der Datenbank keinen Fremdschlüssel haben),
- `application.listeners`,
- `infrastructure.stages`.

Spalten, deren Namen reservierte Wörter sind (zum Beispiel `order`), werden unterstützt.

## CLI {#cli}

Der Befehl `pull` aktualisiert die Schema-Datei (in diesem Beispiel `lambdaORM.yaml`) mit der Struktur der Datenbanken des Stages:

```sh
lambdaorm pull
```

| Option | Beschreibung |
|--------|-------------|
| `-w`, `--workspace` | Ordner des Projekts (Standard: der aktuelle Ordner). |
| `-s`, `--stage` | Name des Stages (Standard: der erste Stage). |
| `-e`, `--envfile` | Zu lesende Datei mit Umgebungsvariablen. |

Pull schreibt außerdem in den Ordner `orm_state` das Modell des Stages und die DDL der übernommenen Struktur, in einem Ordner pro Quelle.
Die DDL dient als Protokoll: Sie wird nicht ausgeführt.

Erstellte Dateien:

```sh
├── orm_state
│   ├── default-model.json
│   └── default
│       └── V240501212640__pull.sql
```

Inhalt der generierten Datei `V240501212640__pull.sql` (Northwind auf MySQL):

```sql
CREATE TABLE Categories (CategoryID INTEGER  AUTO_INCREMENT,CategoryName VARCHAR(15) NOT NULL ,Description TEXT  ,Picture LONGBLOB  ,CONSTRAINT Categories_PK PRIMARY KEY (CategoryID));
CREATE TABLE CustomerCustomerDemo (CustomerID VARCHAR(5) NOT NULL ,CustomerTypeID VARCHAR(10) NOT NULL ,CONSTRAINT CustomerCustomerDemo_PK PRIMARY KEY (CustomerID,CustomerTypeID));
CREATE TABLE CustomerDemographics (CustomerTypeID VARCHAR(10) NOT NULL ,CustomerDesc TEXT  ,CONSTRAINT CustomerDemographics_PK PRIMARY KEY (CustomerTypeID));
CREATE TABLE Customers (CustomerID VARCHAR(5) NOT NULL ,CompanyName VARCHAR(40) NOT NULL ,ContactName VARCHAR(30)  ,ContactTitle VARCHAR(30)  ,Address VARCHAR(60)  ,City VARCHAR(15)  ,Region VARCHAR(15)  ,PostalCode VARCHAR(10)  ,Country VARCHAR(15)  ,Phone VARCHAR(24)  ,Fax VARCHAR(24)  ,CONSTRAINT Customers_PK PRIMARY KEY (CustomerID));
CREATE TABLE EmployeeTerritories (EmployeeID INTEGER NOT NULL ,TerritoryID VARCHAR(20) NOT NULL ,CONSTRAINT EmployeeTerritories_PK PRIMARY KEY (EmployeeID,TerritoryID));
CREATE TABLE Employees (EmployeeID INTEGER  AUTO_INCREMENT,LastName VARCHAR(20) NOT NULL ,FirstName VARCHAR(10) NOT NULL ,Title VARCHAR(30)  ,TitleOfCourtesy VARCHAR(25)  ,BirthDate DATETIME  ,HireDate DATETIME  ,Address VARCHAR(60)  ,City VARCHAR(15)  ,Region VARCHAR(15)  ,PostalCode VARCHAR(10)  ,Country VARCHAR(15)  ,HomePhone VARCHAR(24)  ,Extension VARCHAR(4)  ,Photo LONGBLOB  ,Notes TEXT NOT NULL ,ReportsTo INTEGER  ,PhotoPath VARCHAR(255)  ,Salary DECIMAL(10,4)  ,CONSTRAINT Employees_PK PRIMARY KEY (EmployeeID));
CREATE TABLE `Order Details` (OrderID INTEGER NOT NULL ,ProductID INTEGER NOT NULL ,UnitPrice DECIMAL(10,4) NOT NULL ,Quantity INTEGER NOT NULL ,Discount DECIMAL(10,4) NOT NULL ,CONSTRAINT `Order Details_PK` PRIMARY KEY (OrderID,ProductID));
CREATE TABLE Orders (OrderID INTEGER  AUTO_INCREMENT,CustomerID VARCHAR(5) NOT NULL ,EmployeeID INTEGER NOT NULL ,OrderDate DATETIME  ,RequiredDate DATETIME  ,ShippedDate DATETIME  ,ShipVia INTEGER  ,Freight DECIMAL(10,4)  ,ShipName VARCHAR(40)  ,ShipAddress VARCHAR(60)  ,ShipCity VARCHAR(15)  ,ShipRegion VARCHAR(15)  ,ShipPostalCode VARCHAR(10)  ,ShipCountry VARCHAR(15)  ,CONSTRAINT Orders_PK PRIMARY KEY (CustomerID,EmployeeID,OrderID));
CREATE TABLE Products (ProductID INTEGER  AUTO_INCREMENT,ProductName VARCHAR(40) NOT NULL ,SupplierID INTEGER NOT NULL ,CategoryID INTEGER NOT NULL ,QuantityPerUnit VARCHAR(20)  ,UnitPrice DECIMAL(10,4)  ,UnitsInStock INTEGER  ,UnitsOnOrder INTEGER  ,ReorderLevel INTEGER  ,Discontinued INTEGER NOT NULL ,CONSTRAINT Products_PK PRIMARY KEY (CategoryID,ProductID,SupplierID));
CREATE TABLE Region (RegionID INTEGER NOT NULL ,RegionDescription VARCHAR(50) NOT NULL ,CONSTRAINT Region_PK PRIMARY KEY (RegionID));
CREATE TABLE Shippers (ShipperID INTEGER  AUTO_INCREMENT,CompanyName VARCHAR(40) NOT NULL ,Phone VARCHAR(24)  ,CONSTRAINT Shippers_PK PRIMARY KEY (ShipperID));
CREATE TABLE Suppliers (SupplierID INTEGER  AUTO_INCREMENT,CompanyName VARCHAR(40) NOT NULL ,ContactName VARCHAR(30)  ,ContactTitle VARCHAR(30)  ,Address VARCHAR(60)  ,City VARCHAR(15)  ,Region VARCHAR(15)  ,PostalCode VARCHAR(10)  ,Country VARCHAR(15)  ,Phone VARCHAR(24)  ,Fax VARCHAR(24)  ,HomePage TEXT  ,CONSTRAINT Suppliers_PK PRIMARY KEY (SupplierID));
CREATE TABLE Territories (TerritoryID VARCHAR(20) NOT NULL ,TerritoryDescription VARCHAR(50) NOT NULL ,RegionID INTEGER NOT NULL ,CONSTRAINT Territories_PK PRIMARY KEY (TerritoryID,RegionID));
ALTER TABLE CustomerCustomerDemo ADD CONSTRAINT CustomerCustomerDemo_customerCustomerDemo_FK FOREIGN KEY (CustomerTypeID) REFERENCES CustomerDemographics (CustomerTypeID);
ALTER TABLE CustomerCustomerDemo ADD CONSTRAINT CustomerCustomerDemo_customerCustomerDemo_FK FOREIGN KEY (CustomerID) REFERENCES Customers (CustomerID);
ALTER TABLE EmployeeTerritories ADD CONSTRAINT EmployeeTerritories_employeeTerritories_FK FOREIGN KEY (EmployeeID) REFERENCES Employees (EmployeeID);
ALTER TABLE Employees ADD CONSTRAINT Employees_employees_FK FOREIGN KEY (ReportsTo) REFERENCES Employees (EmployeeID);
ALTER TABLE `Order Details` ADD CONSTRAINT `Order Details_order_FK` FOREIGN KEY (OrderID) REFERENCES Orders (OrderID);
ALTER TABLE `Order Details` ADD CONSTRAINT `Order Details_order_FK` FOREIGN KEY (ProductID) REFERENCES Products (ProductID);
ALTER TABLE Orders ADD CONSTRAINT Orders_orders_FK FOREIGN KEY (CustomerID) REFERENCES Customers (CustomerID);
ALTER TABLE Orders ADD CONSTRAINT Orders_orders_FK FOREIGN KEY (EmployeeID) REFERENCES Employees (EmployeeID);
ALTER TABLE Orders ADD CONSTRAINT Orders_orders_FK FOREIGN KEY (ShipVia) REFERENCES Shippers (ShipperID);
ALTER TABLE Products ADD CONSTRAINT Products_products_FK FOREIGN KEY (CategoryID) REFERENCES Categories (CategoryID);
ALTER TABLE Products ADD CONSTRAINT Products_products_FK FOREIGN KEY (SupplierID) REFERENCES Suppliers (SupplierID);
ALTER TABLE Territories ADD CONSTRAINT Territories_territories_FK FOREIGN KEY (RegionID) REFERENCES Region (RegionID);
```

Siehe das [CLI-Lab](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/11-pull).

## Node {#node}

`orm.stage.pull()` aktualisiert die Schema-Datei mit der Struktur der Datenbanken des Stages:

```typescript
import { Orm } from '@lambdaorm/lib'
(async () => {
	const orm = new Orm()
	try {
		await orm.init('./lambdaORM.yaml')
		await orm.stage.pull({ stage: 'default' })
	} catch (e) {
		console.log(e)
	} finally {
		await orm.end()
	}
})()
```

Siehe das [Node-Lab](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/node/11-pull).
