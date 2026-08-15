CREATE DATABASE  IF NOT EXISTS `smartreserva` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `smartreserva`;
-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: smartreserva
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `classificacao`
--

DROP TABLE IF EXISTS `classificacao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classificacao` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classificacao`
--

LOCK TABLES `classificacao` WRITE;
/*!40000 ALTER TABLE `classificacao` DISABLE KEYS */;
INSERT INTO `classificacao` VALUES (1,'Data-Show'),(2,'Caixa de Som'),(3,'Microfone'),(4,'Notebook'),(5,'Eletrônico'),(6,'Laboratório'),(7,'Auditório');
/*!40000 ALTER TABLE `classificacao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `emprestimo`
--

DROP TABLE IF EXISTS `emprestimo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emprestimo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_itens` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `data_reserva` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fim` time NOT NULL,
  `status` varchar(50) DEFAULT 'reservado',
  `data_realizacao_reserva` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_usuario` (`id_usuario`),
  KEY `emprestimo_ibfk_1` (`id_itens`),
  CONSTRAINT `emprestimo_ibfk_1` FOREIGN KEY (`id_itens`) REFERENCES `itens` (`id`),
  CONSTRAINT `emprestimo_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `emprestimo`
--

LOCK TABLES `emprestimo` WRITE;
/*!40000 ALTER TABLE `emprestimo` DISABLE KEYS */;
INSERT INTO `emprestimo` VALUES (2,7,1,'2026-08-31','07:30:00','08:20:00','reservado','2026-08-12'),(3,7,1,'2026-08-31','08:20:00','09:10:00','reservado','2026-08-14');
/*!40000 ALTER TABLE `emprestimo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `itens`
--

DROP TABLE IF EXISTS `itens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `itens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `Nome` varchar(255) NOT NULL,
  `id_classificacao` int(11) NOT NULL,
  `descricao` text DEFAULT NULL,
  `quantidade` int(11) NOT NULL DEFAULT 1,
  `id_localizacao` int(11) NOT NULL,
  `especificacoestec` text DEFAULT NULL,
  `categoria` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `ativo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `id_classificacao` (`id_classificacao`),
  KEY `id_localizacao` (`id_localizacao`),
  CONSTRAINT `itens_ibfk_1` FOREIGN KEY (`id_classificacao`) REFERENCES `classificacao` (`id`),
  CONSTRAINT `itens_ibfk_2` FOREIGN KEY (`id_localizacao`) REFERENCES `localizacao` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `itens`
--

LOCK TABLES `itens` WRITE;
/*!40000 ALTER TABLE `itens` DISABLE KEYS */;
INSERT INTO `itens` VALUES (3,'ad',1,NULL,1,1,NULL,'EQUIPAMENTO','2026-06-28 23:41:01',0),(4,'testando',1,'oiii',1,3,NULL,'EQUIPAMENTO','2026-07-29 18:26:58',1),(5,'ab',2,'testando descrição ',1,1,'testando especificações ','ESPAÇO','2026-07-29 18:29:11',0),(6,'teste',2,NULL,1,2,NULL,'EQUIPAMENTO','2026-07-29 18:29:57',1),(7,'oiiiiii',2,NULL,1,1,NULL,'EQUIPAMENTO','2026-07-29 18:31:09',1),(8,'epson',2,'oi',1,1,NULL,'EQUIPAMENTO','2026-08-05 16:38:41',0),(9,'abobrinha',2,NULL,1,1,NULL,'EQUIPAMENTO','2026-08-05 17:24:49',0),(10,'teste',1,NULL,1,1,NULL,'EQUIPAMENTO','2026-08-11 00:05:44',1);
/*!40000 ALTER TABLE `itens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `localizacao`
--

DROP TABLE IF EXISTS `localizacao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `localizacao` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `localizacao`
--

LOCK TABLES `localizacao` WRITE;
/*!40000 ALTER TABLE `localizacao` DISABLE KEYS */;
INSERT INTO `localizacao` VALUES (1,'Laboratório de Informática'),(2,'Auditório'),(3,'Sala');
/*!40000 ALTER TABLE `localizacao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT 'professor',
  `ativo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `email_5` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'administrador','testad@gmail.com','admin123','admin',1),(2,'professor','professor@gmail.com','professor123','professor',1);
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-14 23:35:02
