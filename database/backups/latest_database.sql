-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: lead_management_crm
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activities`
--

DROP TABLE IF EXISTS `activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activities` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) DEFAULT NULL,
  `leadId` varchar(191) DEFAULT NULL,
  `studentId` varchar(191) DEFAULT NULL,
  `entityType` varchar(191) DEFAULT NULL,
  `entityId` varchar(191) DEFAULT NULL,
  `action` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `activities_leadId_idx` (`leadId`),
  KEY `activities_studentId_idx` (`studentId`),
  KEY `activities_entityType_entityId_idx` (`entityType`,`entityId`),
  KEY `activities_createdAt_idx` (`createdAt`),
  KEY `activities_userId_fkey` (`userId`),
  CONSTRAINT `activities_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `leads` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `activities_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `activities_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activities`
--

LOCK TABLES `activities` WRITE;
/*!40000 ALTER TABLE `activities` DISABLE KEYS */;
INSERT INTO `activities` VALUES ('0fac8b8e-f004-4080-9c84-2aefbd479f01','f16e56db-fd62-4993-a487-7fb5906e5caf','5a663213-88f8-4414-aa01-04ffe6779a75',NULL,'LEAD','5a663213-88f8-4414-aa01-04ffe6779a75','WALK_IN_REGISTERED','Walk-in registered — Token H-101','{\"leadCode\":\"MAIN-LEAD-2026-000001\",\"tokenNumber\":\"H-101\",\"status\":\"WAITING\"}','2026-07-04 07:12:53.506'),('96a0b09a-8478-4f19-bc5c-fc5d4cbf51d6','f16e56db-fd62-4993-a487-7fb5906e5caf','41c1ec0d-ff02-4741-9aa8-8acea690e181',NULL,'ENQUIRY','cf4ba80b-9f14-4321-aa4d-3c7c626ca345','ENQUIRY_CREATED','Qualified enquiry MAIN-ENQ000002 created from counselling','{\"enquiryId\":\"cf4ba80b-9f14-4321-aa4d-3c7c626ca345\",\"enquiryCode\":\"MAIN-ENQ000002\",\"leadCode\":\"MAIN-LEAD-2026-000002\"}','2026-07-06 07:45:07.624'),('db84b6bf-ef6a-4cda-9adb-4f22c35ff303','f16e56db-fd62-4993-a487-7fb5906e5caf','41c1ec0d-ff02-4741-9aa8-8acea690e181',NULL,'LEAD','41c1ec0d-ff02-4741-9aa8-8acea690e181','WALK_IN_REGISTERED','Walk-in registered — Token H-101','{\"leadCode\":\"MAIN-LEAD-2026-000002\",\"tokenNumber\":\"H-101\",\"status\":\"WAITING\"}','2026-07-06 07:45:07.562'),('edf73f87-aabb-4729-b76f-da24b15cb45e','f16e56db-fd62-4993-a487-7fb5906e5caf','5a663213-88f8-4414-aa01-04ffe6779a75',NULL,'ENQUIRY','262f50e2-74a4-4475-8571-f55d77a9b8d8','ENQUIRY_CREATED','Qualified enquiry MAIN-ENQ000001 created from counselling','{\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"enquiryCode\":\"MAIN-ENQ000001\",\"leadCode\":\"MAIN-LEAD-2026-000001\"}','2026-07-04 07:32:08.491');
/*!40000 ALTER TABLE `activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admission_documents`
--

DROP TABLE IF EXISTS `admission_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admission_documents` (
  `id` varchar(191) NOT NULL,
  `admissionId` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `fileName` varchar(191) NOT NULL,
  `filePath` varchar(191) NOT NULL,
  `fileSize` int(11) NOT NULL,
  `mimeType` varchar(191) NOT NULL,
  `category` varchar(191) DEFAULT NULL,
  `isMandatory` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('PENDING','VERIFIED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `rejectionReason` text DEFAULT NULL,
  `verifiedBy` varchar(191) DEFAULT NULL,
  `verifiedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `admission_documents_admissionId_idx` (`admissionId`),
  CONSTRAINT `admission_documents_admissionId_fkey` FOREIGN KEY (`admissionId`) REFERENCES `admissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admission_documents`
--

LOCK TABLES `admission_documents` WRITE;
/*!40000 ALTER TABLE `admission_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `admission_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admission_payments`
--

DROP TABLE IF EXISTS `admission_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admission_payments` (
  `id` varchar(191) NOT NULL,
  `admissionId` varchar(191) DEFAULT NULL,
  `studentId` varchar(191) DEFAULT NULL,
  `feePlanId` varchar(191) NOT NULL,
  `installmentId` varchar(191) DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `mode` varchar(191) NOT NULL,
  `referenceNo` varchar(191) DEFAULT NULL,
  `receiptNo` varchar(191) NOT NULL,
  `status` enum('PENDING','SUCCESS','FAILED') NOT NULL DEFAULT 'SUCCESS',
  `idempotencyKey` varchar(191) NOT NULL,
  `createdBy` varchar(191) NOT NULL,
  `paidAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admission_payments_receiptNo_key` (`receiptNo`),
  UNIQUE KEY `admission_payments_idempotencyKey_key` (`idempotencyKey`),
  KEY `admission_payments_admissionId_idx` (`admissionId`),
  KEY `admission_payments_studentId_idx` (`studentId`),
  KEY `admission_payments_feePlanId_idx` (`feePlanId`),
  KEY `admission_payments_installmentId_idx` (`installmentId`),
  CONSTRAINT `admission_payments_admissionId_fkey` FOREIGN KEY (`admissionId`) REFERENCES `admissions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `admission_payments_feePlanId_fkey` FOREIGN KEY (`feePlanId`) REFERENCES `fee_plans` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `admission_payments_installmentId_fkey` FOREIGN KEY (`installmentId`) REFERENCES `fee_installments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `admission_payments_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admission_payments`
--

LOCK TABLES `admission_payments` WRITE;
/*!40000 ALTER TABLE `admission_payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `admission_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admission_receipts`
--

DROP TABLE IF EXISTS `admission_receipts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admission_receipts` (
  `id` varchar(191) NOT NULL,
  `paymentId` varchar(191) NOT NULL,
  `receiptNo` varchar(191) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`details`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `admission_receipts_receiptNo_key` (`receiptNo`),
  KEY `admission_receipts_paymentId_idx` (`paymentId`),
  CONSTRAINT `admission_receipts_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `admission_payments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admission_receipts`
--

LOCK TABLES `admission_receipts` WRITE;
/*!40000 ALTER TABLE `admission_receipts` DISABLE KEYS */;
/*!40000 ALTER TABLE `admission_receipts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admissions`
--

DROP TABLE IF EXISTS `admissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admissions` (
  `id` varchar(191) NOT NULL,
  `admissionNo` varchar(191) NOT NULL,
  `enquiryId` varchar(191) DEFAULT NULL,
  `branchId` varchar(191) NOT NULL,
  `firstName` varchar(191) NOT NULL,
  `lastName` varchar(191) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `phone` varchar(191) NOT NULL,
  `dateOfBirth` datetime(3) DEFAULT NULL,
  `gender` varchar(191) DEFAULT NULL,
  `nationality` varchar(191) DEFAULT NULL,
  `passportNo` varchar(191) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `course` varchar(191) NOT NULL,
  `university` varchar(191) NOT NULL,
  `intake` varchar(191) DEFAULT NULL,
  `country` varchar(191) DEFAULT NULL,
  `status` enum('DRAFT','DOCS_PENDING','FEE_PENDING','APPROVAL_PENDING','CONFIRMED','REJECTED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`metadata`)),
  `createdBy` varchar(191) NOT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  `approvedBy` varchar(191) DEFAULT NULL,
  `approvedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admissions_admissionNo_key` (`admissionNo`),
  UNIQUE KEY `admissions_enquiryId_key` (`enquiryId`),
  KEY `admissions_branchId_idx` (`branchId`),
  KEY `admissions_status_idx` (`status`),
  KEY `admissions_admissionNo_idx` (`admissionNo`),
  CONSTRAINT `admissions_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `admissions_enquiryId_fkey` FOREIGN KEY (`enquiryId`) REFERENCES `enquiries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admissions`
--

LOCK TABLES `admissions` WRITE;
/*!40000 ALTER TABLE `admissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `admissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `applications`
--

DROP TABLE IF EXISTS `applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `applications` (
  `id` varchar(191) NOT NULL,
  `studentId` varchar(191) NOT NULL,
  `university` varchar(191) NOT NULL,
  `course` varchar(191) NOT NULL,
  `intake` varchar(191) DEFAULT NULL,
  `country` varchar(191) DEFAULT NULL,
  `status` enum('DRAFT','SUBMITTED','UNDER_REVIEW','CONDITIONAL_OFFER','UNCONDITIONAL_OFFER','REJECTED','WITHDRAWN') NOT NULL DEFAULT 'DRAFT',
  `applicationNo` varchar(191) DEFAULT NULL,
  `submittedAt` datetime(3) DEFAULT NULL,
  `offerDate` datetime(3) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `applications_studentId_idx` (`studentId`),
  KEY `applications_status_idx` (`status`),
  CONSTRAINT `applications_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `applications`
--

LOCK TABLES `applications` WRITE;
/*!40000 ALTER TABLE `applications` DISABLE KEYS */;
/*!40000 ALTER TABLE `applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appointments`
--

DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `appointments` (
  `id` varchar(191) NOT NULL,
  `studentId` varchar(191) DEFAULT NULL,
  `title` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `startAt` datetime(3) NOT NULL,
  `endAt` datetime(3) DEFAULT NULL,
  `location` varchar(191) DEFAULT NULL,
  `isCompleted` tinyint(1) NOT NULL DEFAULT 0,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `appointments_studentId_idx` (`studentId`),
  KEY `appointments_startAt_idx` (`startAt`),
  CONSTRAINT `appointments_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments`
--

LOCK TABLES `appointments` WRITE;
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
/*!40000 ALTER TABLE `appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assignment_audit_logs`
--

DROP TABLE IF EXISTS `assignment_audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assignment_audit_logs` (
  `id` varchar(191) NOT NULL,
  `leadId` varchar(191) NOT NULL,
  `branchId` varchar(191) NOT NULL,
  `actorId` varchar(191) DEFAULT NULL,
  `action` varchar(191) NOT NULL,
  `fromUserId` varchar(191) DEFAULT NULL,
  `toUserId` varchar(191) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `assignment_audit_logs_leadId_idx` (`leadId`),
  KEY `assignment_audit_logs_branchId_idx` (`branchId`),
  KEY `assignment_audit_logs_createdAt_idx` (`createdAt`),
  CONSTRAINT `assignment_audit_logs_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `leads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignment_audit_logs`
--

LOCK TABLES `assignment_audit_logs` WRITE;
/*!40000 ALTER TABLE `assignment_audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `assignment_audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assignment_offers`
--

DROP TABLE IF EXISTS `assignment_offers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assignment_offers` (
  `id` varchar(191) NOT NULL,
  `leadId` varchar(191) NOT NULL,
  `counsellorId` varchar(191) NOT NULL,
  `branchId` varchar(191) NOT NULL,
  `status` enum('PENDING','ACCEPTED','REJECTED','EXPIRED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `offeredAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `expiresAt` datetime(3) NOT NULL,
  `respondedAt` datetime(3) DEFAULT NULL,
  `rejectReason` text DEFAULT NULL,
  `assignmentScore` double DEFAULT NULL,
  `ruleSnapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`ruleSnapshot`)),
  `createdBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `assignment_offers_leadId_idx` (`leadId`),
  KEY `assignment_offers_counsellorId_idx` (`counsellorId`),
  KEY `assignment_offers_branchId_idx` (`branchId`),
  KEY `assignment_offers_status_idx` (`status`),
  KEY `assignment_offers_expiresAt_idx` (`expiresAt`),
  CONSTRAINT `assignment_offers_counsellorId_fkey` FOREIGN KEY (`counsellorId`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `assignment_offers_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `leads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignment_offers`
--

LOCK TABLES `assignment_offers` WRITE;
/*!40000 ALTER TABLE `assignment_offers` DISABLE KEYS */;
/*!40000 ALTER TABLE `assignment_offers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_logs` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) DEFAULT NULL,
  `action` enum('CREATE','UPDATE','DELETE','RESTORE','LOGIN','LOGOUT','EXPORT','IMPORT','ASSIGN','STATUS_CHANGE') NOT NULL,
  `entityType` varchar(191) NOT NULL,
  `entityId` varchar(191) DEFAULT NULL,
  `oldData` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`oldData`)),
  `newData` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`newData`)),
  `ipAddress` varchar(191) DEFAULT NULL,
  `userAgent` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `audit_logs_userId_idx` (`userId`),
  KEY `audit_logs_entityType_entityId_idx` (`entityType`,`entityId`),
  KEY `audit_logs_createdAt_idx` (`createdAt`),
  CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES ('02098e92-cb4c-4e21-ae82-8bb53261fbd2','f16e56db-fd62-4993-a487-7fb5906e5caf','LOGIN','User','f16e56db-fd62-4993-a487-7fb5906e5caf',NULL,NULL,'::1','node','2026-08-12 05:36:43.851'),('0e6ca929-c29a-4046-baf7-1ebfc2984782','f16e56db-fd62-4993-a487-7fb5906e5caf','UPDATE','Master:Country','9760d19a-78d4-4c77-becc-3d787e529d2b','{\"id\":\"9760d19a-78d4-4c77-becc-3d787e529d2b\",\"companyId\":\"a7c7c0df-60c6-4a73-88d0-92b2fa521655\",\"code\":\"W1T_MSPO65JK\",\"name\":\"W1 Testland\",\"isoCode\":\"ZZ\",\"phoneCode\":\"+99\",\"currencyCode\":null,\"nationality\":null,\"description\":null,\"isActive\":true,\"sortOrder\":0,\"createdAt\":\"2026-08-12T05:49:27.853Z\",\"updatedAt\":\"2026-08-12T05:49:27.853Z\",\"deletedAt\":null,\"createdBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"updatedBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\"}','{\"id\":\"9760d19a-78d4-4c77-becc-3d787e529d2b\",\"companyId\":\"a7c7c0df-60c6-4a73-88d0-92b2fa521655\",\"code\":\"W1T_MSPO65JK\",\"name\":\"W1 Testland Updated\",\"isoCode\":\"ZZ\",\"phoneCode\":\"+99\",\"currencyCode\":null,\"nationality\":null,\"description\":null,\"isActive\":true,\"sortOrder\":0,\"createdAt\":\"2026-08-12T05:49:27.853Z\",\"updatedAt\":\"2026-08-12T05:49:27.927Z\",\"deletedAt\":null,\"createdBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"updatedBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\"}','::1','node','2026-08-12 05:49:27.932'),('2441612c-afa0-4c14-a6f3-355a3b053307','f16e56db-fd62-4993-a487-7fb5906e5caf','LOGIN','User','f16e56db-fd62-4993-a487-7fb5906e5caf',NULL,NULL,'::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','2026-08-11 12:19:47.739'),('2d632e36-d0b1-41b2-8518-4959253b3420','f16e56db-fd62-4993-a487-7fb5906e5caf','LOGIN','User','f16e56db-fd62-4993-a487-7fb5906e5caf',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-07-06 05:24:01.019'),('35d8c48d-53f6-4d49-afd2-67fc30df9b2c','f16e56db-fd62-4993-a487-7fb5906e5caf','STATUS_CHANGE','enquiry','262f50e2-74a4-4475-8571-f55d77a9b8d8','{\"status\":\"INTERESTED\"}','{\"status\":\"CONTACTED\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-07-06 06:31:08.165'),('3f1e759d-d294-4fb9-b954-9948e59ad95c','f16e56db-fd62-4993-a487-7fb5906e5caf','LOGIN','User','f16e56db-fd62-4993-a487-7fb5906e5caf',NULL,NULL,'::1','node','2026-08-12 05:49:27.566'),('4564451f-f827-4420-9f81-6e51bcc9c4a3','f16e56db-fd62-4993-a487-7fb5906e5caf','UPDATE','enquiry','262f50e2-74a4-4475-8571-f55d77a9b8d8','{\"id\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"enquiryCode\":\"MAIN-ENQ000001\",\"branchId\":\"caabc1ee-3ff0-496c-802a-746bbbbae703\",\"assignedToId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"assignedById\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Darshil\",\"lastName\":\"Kachhadiya\",\"email\":\"kachhadiyadarshil2@gmail.com\",\"mobile\":\"8799338055\",\"mobileCountry\":\"+91\",\"alternateNo\":\"\",\"passportNo\":null,\"dateOfBirth\":null,\"gender\":\"\",\"nationality\":\"\",\"maritalStatus\":\"\",\"address\":\"\",\"highestQual\":\"\",\"interestedCourse\":\"\",\"testsGiven\":[],\"interestedCountry\":\"\",\"intake\":\"\",\"applyLevel\":\"\",\"source\":\"Walk-in\",\"otherReference\":\"\",\"status\":\"INTERESTED\",\"priority\":\"MEDIUM\",\"tags\":[],\"remark\":\"new student\\nVisit purpose: Study Abroad Enquiry\",\"lastRemark\":\"new student\\nVisit purpose: Study Abroad Enquiry\",\"dropReason\":null,\"droppedAt\":null,\"convertedAt\":null,\"lastTouchedAt\":\"2026-07-06T06:31:34.275Z\",\"studentId\":null,\"leadId\":\"5a663213-88f8-4414-aa01-04ffe6779a75\",\"metadata\":{},\"createdAt\":\"2026-07-04T07:32:08.473Z\",\"updatedAt\":\"2026-07-06T06:31:34.277Z\",\"deletedAt\":null,\"createdBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"updatedBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"branch\":{\"id\":\"caabc1ee-3ff0-496c-802a-746bbbbae703\",\"companyId\":\"a7c7c0df-60c6-4a73-88d0-92b2fa521655\",\"name\":\"Head Office\",\"code\":\"HQ\",\"email\":\"hq@crm.com\",\"phone\":null,\"address\":null,\"isActive\":true,\"createdAt\":\"2026-07-04T06:34:52.702Z\",\"updatedAt\":\"2026-07-04T06:46:04.568Z\",\"deletedAt\":null,\"createdBy\":null,\"updatedBy\":null},\"assignedTo\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"},\"assignedBy\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"},\"followups\":[],\"appointments\":[],\"demos\":[],\"notes\":[],\"documents\":[],\"communications\":[],\"student\":null,\"auditLogs\":[{\"id\":\"b8e0e003-42a5-4992-b3d1-d815c5f4d409\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"CONTACTED\",\"newValue\":\"INTERESTED\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:31:34.285Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"607332b0-5aca-4776-af85-1d4d8b711272\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"NEW\",\"newValue\":\"CONTACTED\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:31:12.523Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"f37e956a-22ba-4b43-991d-a490ef712b04\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"CONTACTED\",\"newValue\":\"NEW\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:31:10.638Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"d94c7827-e68e-43f3-9d75-3db8e1d83a0b\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"INTERESTED\",\"newValue\":\"CONTACTED\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:31:08.158Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"1e1669c2-16e5-4d8a-bcab-7fb56ebbf34e\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"UPDATE\",\"field\":\"interestedCourse\",\"oldValue\":\"\",\"newValue\":\"\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:05:41.832Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"fbe70671-528d-4118-9369-31f13a30325c\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"UPDATE\",\"field\":\"interestedCountry\",\"oldValue\":\"\",\"newValue\":\"\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:05:41.832Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"36eeb515-35f8-467a-b5f2-c3467d4ce44b\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"NEW\",\"newValue\":\"INTERESTED\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T05:25:31.562Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"795ee48e-a13e-49b0-9791-2bcee0255243\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"CREATE\",\"field\":null,\"oldValue\":null,\"newValue\":\"MAIN-ENQ000001\",\"description\":\"Qualified enquiry from walk-in MAIN-LEAD-2026-000001\",\"ipAddress\":null,\"createdAt\":\"2026-07-04T07:32:08.482Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}}]}','{\"id\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"enquiryCode\":\"MAIN-ENQ000001\",\"branchId\":\"caabc1ee-3ff0-496c-802a-746bbbbae703\",\"assignedToId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"assignedById\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Darshil\",\"lastName\":\"Kachhadiya\",\"email\":\"kachhadiyadarshil2@gmail.com\",\"mobile\":\"8799338055\",\"mobileCountry\":\"+91\",\"alternateNo\":\"\",\"passportNo\":null,\"dateOfBirth\":null,\"gender\":\"Male\",\"nationality\":\"\",\"maritalStatus\":\"\",\"address\":\"\",\"highestQual\":\"\",\"interestedCourse\":\"\",\"testsGiven\":[],\"interestedCountry\":\"\",\"intake\":\"\",\"applyLevel\":\"\",\"source\":\"Walk-in\",\"otherReference\":\"\",\"status\":\"INTERESTED\",\"priority\":\"MEDIUM\",\"tags\":[],\"remark\":\"new student\\nVisit purpose: Study Abroad Enquiry\",\"lastRemark\":\"new student\\nVisit purpose: Study Abroad Enquiry\",\"dropReason\":null,\"droppedAt\":null,\"convertedAt\":null,\"lastTouchedAt\":\"2026-07-06T06:32:30.550Z\",\"studentId\":null,\"leadId\":\"5a663213-88f8-4414-aa01-04ffe6779a75\",\"metadata\":{},\"createdAt\":\"2026-07-04T07:32:08.473Z\",\"updatedAt\":\"2026-07-06T06:32:30.551Z\",\"deletedAt\":null,\"createdBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"updatedBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-07-06 06:32:30.579'),('4e09bdc1-df06-462e-939f-cbc6d10d9e01','f16e56db-fd62-4993-a487-7fb5906e5caf','CREATE','enquiry','cf4ba80b-9f14-4321-aa4d-3c7c626ca345',NULL,'{\"id\":\"cf4ba80b-9f14-4321-aa4d-3c7c626ca345\",\"enquiryCode\":\"MAIN-ENQ000002\",\"branchId\":\"caabc1ee-3ff0-496c-802a-746bbbbae703\",\"assignedToId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"assignedById\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Rahul\",\"lastName\":\"Patel\",\"email\":\"rahul.patel@test.com\",\"mobile\":\"1234567890\",\"mobileCountry\":\"+91\",\"alternateNo\":null,\"passportNo\":null,\"dateOfBirth\":null,\"gender\":null,\"nationality\":null,\"maritalStatus\":null,\"address\":null,\"highestQual\":null,\"interestedCourse\":null,\"testsGiven\":[],\"interestedCountry\":null,\"intake\":null,\"applyLevel\":null,\"source\":\"Walk-in\",\"otherReference\":null,\"status\":\"NEW\",\"priority\":\"MEDIUM\",\"tags\":[],\"remark\":\"123\\nVisit purpose: Study Abroad Enquiry\",\"lastRemark\":null,\"dropReason\":null,\"droppedAt\":null,\"convertedAt\":null,\"lastTouchedAt\":\"2026-07-06T07:45:07.594Z\",\"studentId\":null,\"leadId\":\"41c1ec0d-ff02-4741-9aa8-8acea690e181\",\"metadata\":{},\"createdAt\":\"2026-07-06T07:45:07.595Z\",\"updatedAt\":\"2026-07-06T07:45:07.595Z\",\"deletedAt\":null,\"createdBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"updatedBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-07-06 07:45:07.619'),('529ac0f3-8bee-4fb1-8129-89b8edaf2fa7','f16e56db-fd62-4993-a487-7fb5906e5caf','STATUS_CHANGE','enquiry','262f50e2-74a4-4475-8571-f55d77a9b8d8','{\"status\":\"NEW\"}','{\"status\":\"INTERESTED\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-07-06 05:25:31.567'),('531b6d28-4d7c-4ca8-8c8c-91a9f7ac02c7','f16e56db-fd62-4993-a487-7fb5906e5caf','LOGIN','User','f16e56db-fd62-4993-a487-7fb5906e5caf',NULL,NULL,'::1','node','2026-08-12 05:37:03.838'),('588f1b6b-3ac9-4137-80a8-30e3f7da637f','f16e56db-fd62-4993-a487-7fb5906e5caf','UPDATE','enquiry','cf4ba80b-9f14-4321-aa4d-3c7c626ca345','{\"tags\":[]}','{\"tags\":[\"PTE\"]}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','2026-08-12 06:01:22.712'),('5ba8331c-ab03-42cd-ac3f-a0e36929d6db','f16e56db-fd62-4993-a487-7fb5906e5caf','LOGOUT','User','f16e56db-fd62-4993-a487-7fb5906e5caf',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-07-06 07:33:45.161'),('5cc2e31f-d9bf-4018-a28d-f1f2c84f6c6e','f16e56db-fd62-4993-a487-7fb5906e5caf','LOGIN','User','f16e56db-fd62-4993-a487-7fb5906e5caf',NULL,NULL,'::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456','2026-07-06 05:24:31.282'),('5f649654-be84-4d46-a960-23a578bb3085','f16e56db-fd62-4993-a487-7fb5906e5caf','UPDATE','enquiry','262f50e2-74a4-4475-8571-f55d77a9b8d8','{\"id\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"enquiryCode\":\"MAIN-ENQ000001\",\"branchId\":\"caabc1ee-3ff0-496c-802a-746bbbbae703\",\"assignedToId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"assignedById\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Darshil\",\"lastName\":\"Kachhadiya\",\"email\":\"kachhadiyadarshil2@gmail.com\",\"mobile\":\"8799338055\",\"mobileCountry\":\"+91\",\"alternateNo\":\"12333367\",\"passportNo\":null,\"dateOfBirth\":\"2005-12-02T00:00:00.000Z\",\"gender\":\"Male\",\"nationality\":\"India\",\"maritalStatus\":\"Single\",\"address\":\"A/120,Tirupati society near balagi bungalows, savaliya circle, yogi chowk , surat.\",\"highestQual\":\"\",\"interestedCourse\":\"MBA\",\"testsGiven\":[],\"interestedCountry\":\"Canada\",\"intake\":\"Jul-2026\",\"applyLevel\":\"\",\"source\":\"Walk-in\",\"otherReference\":\"12222\",\"status\":\"INTERESTED\",\"priority\":\"MEDIUM\",\"tags\":[\"IELTS\",\"CANADA\",\"AUSTRALIA\",\"VIP\",\"SCHOLARSHIP\"],\"remark\":\"new student\\nVisit purpose: Study Abroad Enquiry\",\"lastRemark\":\"new student\\nVisit purpose: Study Abroad Enquiry\",\"dropReason\":null,\"droppedAt\":null,\"convertedAt\":null,\"lastTouchedAt\":\"2026-07-06T06:34:33.058Z\",\"studentId\":null,\"leadId\":\"5a663213-88f8-4414-aa01-04ffe6779a75\",\"metadata\":{},\"createdAt\":\"2026-07-04T07:32:08.473Z\",\"updatedAt\":\"2026-07-06T06:34:33.059Z\",\"deletedAt\":null,\"createdBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"updatedBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"branch\":{\"id\":\"caabc1ee-3ff0-496c-802a-746bbbbae703\",\"companyId\":\"a7c7c0df-60c6-4a73-88d0-92b2fa521655\",\"name\":\"Head Office\",\"code\":\"HQ\",\"email\":\"hq@crm.com\",\"phone\":null,\"address\":null,\"isActive\":true,\"createdAt\":\"2026-07-04T06:34:52.702Z\",\"updatedAt\":\"2026-07-04T06:46:04.568Z\",\"deletedAt\":null,\"createdBy\":null,\"updatedBy\":null},\"assignedTo\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"},\"assignedBy\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"},\"followups\":[],\"appointments\":[],\"demos\":[],\"notes\":[],\"documents\":[],\"communications\":[],\"student\":null,\"auditLogs\":[{\"id\":\"0cf8b2bb-a7f4-4ac5-9049-169f847dcf06\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"UPDATE\",\"field\":\"interestedCourse\",\"oldValue\":\"\",\"newValue\":\"MBA\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:33:34.972Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"9e098f41-6a70-43f5-b731-3e52a3a27cba\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"UPDATE\",\"field\":\"interestedCountry\",\"oldValue\":\"\",\"newValue\":\"Canada\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:33:34.972Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"b8103bfe-8b6c-4635-8a55-c22b46f8da87\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"UPDATE\",\"field\":\"tags\",\"oldValue\":\"[]\",\"newValue\":\"[\\\"IELTS\\\",\\\"CANADA\\\",\\\"AUSTRALIA\\\",\\\"VIP\\\",\\\"SCHOLARSHIP\\\"]\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:33:34.972Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"b8e0e003-42a5-4992-b3d1-d815c5f4d409\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"CONTACTED\",\"newValue\":\"INTERESTED\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:31:34.285Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"607332b0-5aca-4776-af85-1d4d8b711272\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"NEW\",\"newValue\":\"CONTACTED\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:31:12.523Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"f37e956a-22ba-4b43-991d-a490ef712b04\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"CONTACTED\",\"newValue\":\"NEW\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:31:10.638Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"d94c7827-e68e-43f3-9d75-3db8e1d83a0b\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"INTERESTED\",\"newValue\":\"CONTACTED\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:31:08.158Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"1e1669c2-16e5-4d8a-bcab-7fb56ebbf34e\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"UPDATE\",\"field\":\"interestedCourse\",\"oldValue\":\"\",\"newValue\":\"\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:05:41.832Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"fbe70671-528d-4118-9369-31f13a30325c\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"UPDATE\",\"field\":\"interestedCountry\",\"oldValue\":\"\",\"newValue\":\"\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:05:41.832Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"36eeb515-35f8-467a-b5f2-c3467d4ce44b\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"NEW\",\"newValue\":\"INTERESTED\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T05:25:31.562Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"795ee48e-a13e-49b0-9791-2bcee0255243\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"CREATE\",\"field\":null,\"oldValue\":null,\"newValue\":\"MAIN-ENQ000001\",\"description\":\"Qualified enquiry from walk-in MAIN-LEAD-2026-000001\",\"ipAddress\":null,\"createdAt\":\"2026-07-04T07:32:08.482Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}}]}','{\"id\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"enquiryCode\":\"MAIN-ENQ000001\",\"branchId\":\"caabc1ee-3ff0-496c-802a-746bbbbae703\",\"assignedToId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"assignedById\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Darshil\",\"lastName\":\"Kachhadiya\",\"email\":\"kachhadiyadarshil2@gmail.com\",\"mobile\":\"8799338055\",\"mobileCountry\":\"+91\",\"alternateNo\":\"12333367\",\"passportNo\":null,\"dateOfBirth\":\"2005-12-02T00:00:00.000Z\",\"gender\":\"Male\",\"nationality\":\"India\",\"maritalStatus\":\"Single\",\"address\":\"A/120,Tirupati society near balagi bungalows, savaliya circle, yogi chowk , surat.\",\"highestQual\":\"\",\"interestedCourse\":\"MBA\",\"testsGiven\":[],\"interestedCountry\":\"Canada\",\"intake\":\"Jul-2026\",\"applyLevel\":\"\",\"source\":\"Walk-in\",\"otherReference\":\"12222\",\"status\":\"INTERESTED\",\"priority\":\"MEDIUM\",\"tags\":[\"IELTS\",\"CANADA\",\"AUSTRALIA\",\"VIP\",\"SCHOLARSHIP\"],\"remark\":\"new student\\nVisit purpose: Study Abroad Enquiry\",\"lastRemark\":\"new student\\nVisit purpose: Study Abroad Enquiry\",\"dropReason\":null,\"droppedAt\":null,\"convertedAt\":null,\"lastTouchedAt\":\"2026-07-06T06:35:12.452Z\",\"studentId\":null,\"leadId\":\"5a663213-88f8-4414-aa01-04ffe6779a75\",\"metadata\":{},\"createdAt\":\"2026-07-04T07:32:08.473Z\",\"updatedAt\":\"2026-07-06T06:35:12.454Z\",\"deletedAt\":null,\"createdBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"updatedBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-07-06 06:35:12.466'),('6f83b2df-216e-4d56-ac42-492f9a41f3ec','f16e56db-fd62-4993-a487-7fb5906e5caf','UPDATE','Master:Country','f402dfd2-b07e-4119-8e3a-8af9b6f23f50','{\"id\":\"f402dfd2-b07e-4119-8e3a-8af9b6f23f50\",\"companyId\":\"a7c7c0df-60c6-4a73-88d0-92b2fa521655\",\"code\":\"W1T_MSPNQ7S0\",\"name\":\"W1 Testland\",\"isoCode\":\"ZZ\",\"phoneCode\":\"+99\",\"currencyCode\":null,\"nationality\":null,\"description\":null,\"isActive\":true,\"sortOrder\":0,\"createdAt\":\"2026-08-12T05:37:04.268Z\",\"updatedAt\":\"2026-08-12T05:37:04.268Z\",\"deletedAt\":null,\"createdBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"updatedBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\"}','{\"id\":\"f402dfd2-b07e-4119-8e3a-8af9b6f23f50\",\"companyId\":\"a7c7c0df-60c6-4a73-88d0-92b2fa521655\",\"code\":\"W1T_MSPNQ7S0\",\"name\":\"W1 Testland Updated\",\"isoCode\":\"ZZ\",\"phoneCode\":\"+99\",\"currencyCode\":null,\"nationality\":null,\"description\":null,\"isActive\":true,\"sortOrder\":0,\"createdAt\":\"2026-08-12T05:37:04.268Z\",\"updatedAt\":\"2026-08-12T05:37:04.337Z\",\"deletedAt\":null,\"createdBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"updatedBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\"}','::1','node','2026-08-12 05:37:04.346'),('71796853-a869-442b-a848-98c2058ab70c','f16e56db-fd62-4993-a487-7fb5906e5caf','CREATE','Master:Country','9760d19a-78d4-4c77-becc-3d787e529d2b',NULL,'{\"id\":\"9760d19a-78d4-4c77-becc-3d787e529d2b\",\"companyId\":\"a7c7c0df-60c6-4a73-88d0-92b2fa521655\",\"code\":\"W1T_MSPO65JK\",\"name\":\"W1 Testland\",\"isoCode\":\"ZZ\",\"phoneCode\":\"+99\",\"currencyCode\":null,\"nationality\":null,\"description\":null,\"isActive\":true,\"sortOrder\":0,\"createdAt\":\"2026-08-12T05:49:27.853Z\",\"updatedAt\":\"2026-08-12T05:49:27.853Z\",\"deletedAt\":null,\"createdBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"updatedBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\"}','::1','node','2026-08-12 05:49:27.862'),('73b0f433-50af-41d1-b26c-0cde180b334c','f16e56db-fd62-4993-a487-7fb5906e5caf','CREATE','Lead','5a663213-88f8-4414-aa01-04ffe6779a75',NULL,'{\"leadCode\":\"MAIN-LEAD-2026-000001\",\"tokenNumber\":\"H-101\",\"status\":\"WAITING\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-07-04 07:12:53.512'),('8039fc51-f3cc-4a53-bf16-7e41ef75419b','f16e56db-fd62-4993-a487-7fb5906e5caf','LOGIN','User','f16e56db-fd62-4993-a487-7fb5906e5caf',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-07-06 07:33:47.165'),('865df184-656c-4de1-ab46-d8801c2b0553','f16e56db-fd62-4993-a487-7fb5906e5caf','UPDATE','enquiry','262f50e2-74a4-4475-8571-f55d77a9b8d8','{\"id\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"enquiryCode\":\"MAIN-ENQ000001\",\"branchId\":\"caabc1ee-3ff0-496c-802a-746bbbbae703\",\"assignedToId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"assignedById\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Darshil\",\"lastName\":\"Kachhadiya\",\"email\":\"kachhadiyadarshil2@gmail.com\",\"mobile\":\"8799338055\",\"mobileCountry\":\"+91\",\"alternateNo\":\"\",\"passportNo\":null,\"dateOfBirth\":null,\"gender\":\"Male\",\"nationality\":\"India\",\"maritalStatus\":\"Single\",\"address\":\"A/120,Tirupati society near balagi bungalows, savaliya circle, yogi chowk , surat.\",\"highestQual\":\"\",\"interestedCourse\":\"MBA\",\"testsGiven\":[],\"interestedCountry\":\"Canada\",\"intake\":\"Jul-2026\",\"applyLevel\":\"\",\"source\":\"Walk-in\",\"otherReference\":\"12222\",\"status\":\"INTERESTED\",\"priority\":\"MEDIUM\",\"tags\":[\"IELTS\",\"CANADA\",\"AUSTRALIA\",\"VIP\",\"SCHOLARSHIP\"],\"remark\":\"new student\\nVisit purpose: Study Abroad Enquiry\",\"lastRemark\":\"new student\\nVisit purpose: Study Abroad Enquiry\",\"dropReason\":null,\"droppedAt\":null,\"convertedAt\":null,\"lastTouchedAt\":\"2026-07-06T06:33:34.951Z\",\"studentId\":null,\"leadId\":\"5a663213-88f8-4414-aa01-04ffe6779a75\",\"metadata\":{},\"createdAt\":\"2026-07-04T07:32:08.473Z\",\"updatedAt\":\"2026-07-06T06:33:34.953Z\",\"deletedAt\":null,\"createdBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"updatedBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"branch\":{\"id\":\"caabc1ee-3ff0-496c-802a-746bbbbae703\",\"companyId\":\"a7c7c0df-60c6-4a73-88d0-92b2fa521655\",\"name\":\"Head Office\",\"code\":\"HQ\",\"email\":\"hq@crm.com\",\"phone\":null,\"address\":null,\"isActive\":true,\"createdAt\":\"2026-07-04T06:34:52.702Z\",\"updatedAt\":\"2026-07-04T06:46:04.568Z\",\"deletedAt\":null,\"createdBy\":null,\"updatedBy\":null},\"assignedTo\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"},\"assignedBy\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"},\"followups\":[],\"appointments\":[],\"demos\":[],\"notes\":[],\"documents\":[],\"communications\":[],\"student\":null,\"auditLogs\":[{\"id\":\"0cf8b2bb-a7f4-4ac5-9049-169f847dcf06\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"UPDATE\",\"field\":\"interestedCourse\",\"oldValue\":\"\",\"newValue\":\"MBA\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:33:34.972Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"9e098f41-6a70-43f5-b731-3e52a3a27cba\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"UPDATE\",\"field\":\"interestedCountry\",\"oldValue\":\"\",\"newValue\":\"Canada\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:33:34.972Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"b8103bfe-8b6c-4635-8a55-c22b46f8da87\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"UPDATE\",\"field\":\"tags\",\"oldValue\":\"[]\",\"newValue\":\"[\\\"IELTS\\\",\\\"CANADA\\\",\\\"AUSTRALIA\\\",\\\"VIP\\\",\\\"SCHOLARSHIP\\\"]\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:33:34.972Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"b8e0e003-42a5-4992-b3d1-d815c5f4d409\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"CONTACTED\",\"newValue\":\"INTERESTED\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:31:34.285Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"607332b0-5aca-4776-af85-1d4d8b711272\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"NEW\",\"newValue\":\"CONTACTED\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:31:12.523Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"f37e956a-22ba-4b43-991d-a490ef712b04\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"CONTACTED\",\"newValue\":\"NEW\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:31:10.638Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"d94c7827-e68e-43f3-9d75-3db8e1d83a0b\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"INTERESTED\",\"newValue\":\"CONTACTED\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:31:08.158Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"1e1669c2-16e5-4d8a-bcab-7fb56ebbf34e\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"UPDATE\",\"field\":\"interestedCourse\",\"oldValue\":\"\",\"newValue\":\"\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:05:41.832Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"fbe70671-528d-4118-9369-31f13a30325c\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"UPDATE\",\"field\":\"interestedCountry\",\"oldValue\":\"\",\"newValue\":\"\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:05:41.832Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"36eeb515-35f8-467a-b5f2-c3467d4ce44b\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"NEW\",\"newValue\":\"INTERESTED\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T05:25:31.562Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"795ee48e-a13e-49b0-9791-2bcee0255243\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"CREATE\",\"field\":null,\"oldValue\":null,\"newValue\":\"MAIN-ENQ000001\",\"description\":\"Qualified enquiry from walk-in MAIN-LEAD-2026-000001\",\"ipAddress\":null,\"createdAt\":\"2026-07-04T07:32:08.482Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}}]}','{\"id\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"enquiryCode\":\"MAIN-ENQ000001\",\"branchId\":\"caabc1ee-3ff0-496c-802a-746bbbbae703\",\"assignedToId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"assignedById\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Darshil\",\"lastName\":\"Kachhadiya\",\"email\":\"kachhadiyadarshil2@gmail.com\",\"mobile\":\"8799338055\",\"mobileCountry\":\"+91\",\"alternateNo\":\"12333367\",\"passportNo\":null,\"dateOfBirth\":null,\"gender\":\"Male\",\"nationality\":\"India\",\"maritalStatus\":\"Single\",\"address\":\"A/120,Tirupati society near balagi bungalows, savaliya circle, yogi chowk , surat.\",\"highestQual\":\"\",\"interestedCourse\":\"MBA\",\"testsGiven\":[],\"interestedCountry\":\"Canada\",\"intake\":\"Jul-2026\",\"applyLevel\":\"\",\"source\":\"Walk-in\",\"otherReference\":\"12222\",\"status\":\"INTERESTED\",\"priority\":\"MEDIUM\",\"tags\":[\"IELTS\",\"CANADA\",\"AUSTRALIA\",\"VIP\",\"SCHOLARSHIP\"],\"remark\":\"new student\\nVisit purpose: Study Abroad Enquiry\",\"lastRemark\":\"new student\\nVisit purpose: Study Abroad Enquiry\",\"dropReason\":null,\"droppedAt\":null,\"convertedAt\":null,\"lastTouchedAt\":\"2026-07-06T06:33:42.045Z\",\"studentId\":null,\"leadId\":\"5a663213-88f8-4414-aa01-04ffe6779a75\",\"metadata\":{},\"createdAt\":\"2026-07-04T07:32:08.473Z\",\"updatedAt\":\"2026-07-06T06:33:42.046Z\",\"deletedAt\":null,\"createdBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"updatedBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-07-06 06:33:42.053'),('87424ad2-49f0-4477-9bb8-8cb18953a785','f16e56db-fd62-4993-a487-7fb5906e5caf','UPDATE','enquiry','262f50e2-74a4-4475-8571-f55d77a9b8d8','{\"id\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"enquiryCode\":\"MAIN-ENQ000001\",\"branchId\":\"caabc1ee-3ff0-496c-802a-746bbbbae703\",\"assignedToId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"assignedById\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Darshil\",\"lastName\":\"Kachhadiya\",\"email\":\"kachhadiyadarshil2@gmail.com\",\"mobile\":\"8799338055\",\"mobileCountry\":\"+91\",\"alternateNo\":\"12333367\",\"passportNo\":null,\"dateOfBirth\":\"2005-12-02T00:00:00.000Z\",\"gender\":\"Male\",\"nationality\":\"India\",\"maritalStatus\":\"Single\",\"address\":\"A/120,Tirupati society near balagi bungalows, savaliya circle, yogi chowk , surat.\",\"highestQual\":\"\",\"interestedCourse\":\"MBA\",\"testsGiven\":[],\"interestedCountry\":\"Canada\",\"intake\":\"Jul-2026\",\"applyLevel\":\"\",\"source\":\"Walk-in\",\"otherReference\":\"12222\",\"status\":\"INTERESTED\",\"priority\":\"MEDIUM\",\"tags\":[\"IELTS\",\"CANADA\",\"AUSTRALIA\",\"VIP\",\"SCHOLARSHIP\"],\"remark\":\"new student\\nVisit purpose: Study Abroad Enquiry\",\"lastRemark\":\"new student\\nVisit purpose: Study Abroad Enquiry\",\"dropReason\":null,\"droppedAt\":null,\"convertedAt\":null,\"lastTouchedAt\":\"2026-07-06T06:34:07.441Z\",\"studentId\":null,\"leadId\":\"5a663213-88f8-4414-aa01-04ffe6779a75\",\"metadata\":{},\"createdAt\":\"2026-07-04T07:32:08.473Z\",\"updatedAt\":\"2026-07-06T06:34:07.464Z\",\"deletedAt\":null,\"createdBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"updatedBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"branch\":{\"id\":\"caabc1ee-3ff0-496c-802a-746bbbbae703\",\"companyId\":\"a7c7c0df-60c6-4a73-88d0-92b2fa521655\",\"name\":\"Head Office\",\"code\":\"HQ\",\"email\":\"hq@crm.com\",\"phone\":null,\"address\":null,\"isActive\":true,\"createdAt\":\"2026-07-04T06:34:52.702Z\",\"updatedAt\":\"2026-07-04T06:46:04.568Z\",\"deletedAt\":null,\"createdBy\":null,\"updatedBy\":null},\"assignedTo\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"},\"assignedBy\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"},\"followups\":[],\"appointments\":[],\"demos\":[],\"notes\":[],\"documents\":[],\"communications\":[],\"student\":null,\"auditLogs\":[{\"id\":\"0cf8b2bb-a7f4-4ac5-9049-169f847dcf06\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"UPDATE\",\"field\":\"interestedCourse\",\"oldValue\":\"\",\"newValue\":\"MBA\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:33:34.972Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"9e098f41-6a70-43f5-b731-3e52a3a27cba\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"UPDATE\",\"field\":\"interestedCountry\",\"oldValue\":\"\",\"newValue\":\"Canada\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:33:34.972Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"b8103bfe-8b6c-4635-8a55-c22b46f8da87\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"UPDATE\",\"field\":\"tags\",\"oldValue\":\"[]\",\"newValue\":\"[\\\"IELTS\\\",\\\"CANADA\\\",\\\"AUSTRALIA\\\",\\\"VIP\\\",\\\"SCHOLARSHIP\\\"]\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:33:34.972Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"b8e0e003-42a5-4992-b3d1-d815c5f4d409\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"CONTACTED\",\"newValue\":\"INTERESTED\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:31:34.285Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"607332b0-5aca-4776-af85-1d4d8b711272\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"NEW\",\"newValue\":\"CONTACTED\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:31:12.523Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"f37e956a-22ba-4b43-991d-a490ef712b04\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"CONTACTED\",\"newValue\":\"NEW\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:31:10.638Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"d94c7827-e68e-43f3-9d75-3db8e1d83a0b\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"INTERESTED\",\"newValue\":\"CONTACTED\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:31:08.158Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"1e1669c2-16e5-4d8a-bcab-7fb56ebbf34e\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"UPDATE\",\"field\":\"interestedCourse\",\"oldValue\":\"\",\"newValue\":\"\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:05:41.832Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"fbe70671-528d-4118-9369-31f13a30325c\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"UPDATE\",\"field\":\"interestedCountry\",\"oldValue\":\"\",\"newValue\":\"\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:05:41.832Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"36eeb515-35f8-467a-b5f2-c3467d4ce44b\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"NEW\",\"newValue\":\"INTERESTED\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T05:25:31.562Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"795ee48e-a13e-49b0-9791-2bcee0255243\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"CREATE\",\"field\":null,\"oldValue\":null,\"newValue\":\"MAIN-ENQ000001\",\"description\":\"Qualified enquiry from walk-in MAIN-LEAD-2026-000001\",\"ipAddress\":null,\"createdAt\":\"2026-07-04T07:32:08.482Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}}]}','{\"id\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"enquiryCode\":\"MAIN-ENQ000001\",\"branchId\":\"caabc1ee-3ff0-496c-802a-746bbbbae703\",\"assignedToId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"assignedById\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Darshil\",\"lastName\":\"Kachhadiya\",\"email\":\"kachhadiyadarshil2@gmail.com\",\"mobile\":\"8799338055\",\"mobileCountry\":\"+91\",\"alternateNo\":\"12333367\",\"passportNo\":null,\"dateOfBirth\":\"2005-12-02T00:00:00.000Z\",\"gender\":\"Male\",\"nationality\":\"India\",\"maritalStatus\":\"Single\",\"address\":\"A/120,Tirupati society near balagi bungalows, savaliya circle, yogi chowk , surat.\",\"highestQual\":\"\",\"interestedCourse\":\"MBA\",\"testsGiven\":[],\"interestedCountry\":\"Canada\",\"intake\":\"Jul-2026\",\"applyLevel\":\"\",\"source\":\"Walk-in\",\"otherReference\":\"12222\",\"status\":\"INTERESTED\",\"priority\":\"MEDIUM\",\"tags\":[\"IELTS\",\"CANADA\",\"AUSTRALIA\",\"VIP\",\"SCHOLARSHIP\"],\"remark\":\"new student\\nVisit purpose: Study Abroad Enquiry\",\"lastRemark\":\"new student\\nVisit purpose: Study Abroad Enquiry\",\"dropReason\":null,\"droppedAt\":null,\"convertedAt\":null,\"lastTouchedAt\":\"2026-07-06T06:34:33.058Z\",\"studentId\":null,\"leadId\":\"5a663213-88f8-4414-aa01-04ffe6779a75\",\"metadata\":{},\"createdAt\":\"2026-07-04T07:32:08.473Z\",\"updatedAt\":\"2026-07-06T06:34:33.059Z\",\"deletedAt\":null,\"createdBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"updatedBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-07-06 06:34:33.066'),('879d97f5-4d6e-48c6-af36-d2837d13ba8d','f16e56db-fd62-4993-a487-7fb5906e5caf','UPDATE','enquiry','262f50e2-74a4-4475-8571-f55d77a9b8d8','{\"id\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"enquiryCode\":\"MAIN-ENQ000001\",\"branchId\":\"caabc1ee-3ff0-496c-802a-746bbbbae703\",\"assignedToId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"assignedById\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Darshil\",\"lastName\":\"Kachhadiya\",\"email\":\"kachhadiyadarshil2@gmail.com\",\"mobile\":\"8799338055\",\"mobileCountry\":\"+91\",\"alternateNo\":null,\"passportNo\":null,\"dateOfBirth\":null,\"gender\":null,\"nationality\":null,\"maritalStatus\":null,\"address\":null,\"highestQual\":null,\"interestedCourse\":null,\"testsGiven\":[],\"interestedCountry\":null,\"intake\":null,\"applyLevel\":null,\"source\":\"Walk-in\",\"otherReference\":null,\"status\":\"INTERESTED\",\"priority\":\"MEDIUM\",\"tags\":[],\"remark\":\"new student\\nVisit purpose: Study Abroad Enquiry\",\"lastRemark\":null,\"dropReason\":null,\"droppedAt\":null,\"convertedAt\":null,\"lastTouchedAt\":\"2026-07-06T05:25:31.554Z\",\"studentId\":null,\"leadId\":\"5a663213-88f8-4414-aa01-04ffe6779a75\",\"metadata\":{},\"createdAt\":\"2026-07-04T07:32:08.473Z\",\"updatedAt\":\"2026-07-06T05:25:31.556Z\",\"deletedAt\":null,\"createdBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"updatedBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"branch\":{\"id\":\"caabc1ee-3ff0-496c-802a-746bbbbae703\",\"companyId\":\"a7c7c0df-60c6-4a73-88d0-92b2fa521655\",\"name\":\"Head Office\",\"code\":\"HQ\",\"email\":\"hq@crm.com\",\"phone\":null,\"address\":null,\"isActive\":true,\"createdAt\":\"2026-07-04T06:34:52.702Z\",\"updatedAt\":\"2026-07-04T06:46:04.568Z\",\"deletedAt\":null,\"createdBy\":null,\"updatedBy\":null},\"assignedTo\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"},\"assignedBy\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"},\"followups\":[],\"appointments\":[],\"demos\":[],\"notes\":[],\"documents\":[],\"communications\":[],\"student\":null,\"auditLogs\":[{\"id\":\"36eeb515-35f8-467a-b5f2-c3467d4ce44b\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"NEW\",\"newValue\":\"INTERESTED\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T05:25:31.562Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"795ee48e-a13e-49b0-9791-2bcee0255243\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"CREATE\",\"field\":null,\"oldValue\":null,\"newValue\":\"MAIN-ENQ000001\",\"description\":\"Qualified enquiry from walk-in MAIN-LEAD-2026-000001\",\"ipAddress\":null,\"createdAt\":\"2026-07-04T07:32:08.482Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}}]}','{\"id\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"enquiryCode\":\"MAIN-ENQ000001\",\"branchId\":\"caabc1ee-3ff0-496c-802a-746bbbbae703\",\"assignedToId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"assignedById\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Darshil\",\"lastName\":\"Kachhadiya\",\"email\":\"kachhadiyadarshil2@gmail.com\",\"mobile\":\"8799338055\",\"mobileCountry\":\"+91\",\"alternateNo\":\"\",\"passportNo\":null,\"dateOfBirth\":null,\"gender\":\"\",\"nationality\":\"\",\"maritalStatus\":\"\",\"address\":\"\",\"highestQual\":\"\",\"interestedCourse\":\"\",\"testsGiven\":[],\"interestedCountry\":\"\",\"intake\":\"\",\"applyLevel\":\"\",\"source\":\"Walk-in\",\"otherReference\":\"\",\"status\":\"INTERESTED\",\"priority\":\"MEDIUM\",\"tags\":[],\"remark\":\"new student\\nVisit purpose: Study Abroad Enquiry\",\"lastRemark\":\"new student\\nVisit purpose: Study Abroad Enquiry\",\"dropReason\":null,\"droppedAt\":null,\"convertedAt\":null,\"lastTouchedAt\":\"2026-07-06T06:05:41.821Z\",\"studentId\":null,\"leadId\":\"5a663213-88f8-4414-aa01-04ffe6779a75\",\"metadata\":{},\"createdAt\":\"2026-07-04T07:32:08.473Z\",\"updatedAt\":\"2026-07-06T06:05:41.822Z\",\"deletedAt\":null,\"createdBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"updatedBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-07-06 06:05:41.849'),('9563c53e-21b5-446a-af78-247cec3d39f2','f16e56db-fd62-4993-a487-7fb5906e5caf','DELETE','Master:Country','f402dfd2-b07e-4119-8e3a-8af9b6f23f50','{\"id\":\"f402dfd2-b07e-4119-8e3a-8af9b6f23f50\",\"companyId\":\"a7c7c0df-60c6-4a73-88d0-92b2fa521655\",\"code\":\"W1T_MSPNQ7S0\",\"name\":\"W1 Testland Updated\",\"isoCode\":\"ZZ\",\"phoneCode\":\"+99\",\"currencyCode\":null,\"nationality\":null,\"description\":null,\"isActive\":false,\"sortOrder\":0,\"createdAt\":\"2026-08-12T05:37:04.268Z\",\"updatedAt\":\"2026-08-12T05:37:04.382Z\",\"deletedAt\":null,\"createdBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"updatedBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\"}',NULL,'::1','node','2026-08-12 05:37:04.469'),('a43961d2-d229-4a64-9936-166d9a5730a8','f16e56db-fd62-4993-a487-7fb5906e5caf','CREATE','enquiry','262f50e2-74a4-4475-8571-f55d77a9b8d8',NULL,'{\"id\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"enquiryCode\":\"MAIN-ENQ000001\",\"branchId\":\"caabc1ee-3ff0-496c-802a-746bbbbae703\",\"assignedToId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"assignedById\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Darshil\",\"lastName\":\"Kachhadiya\",\"email\":\"kachhadiyadarshil2@gmail.com\",\"mobile\":\"8799338055\",\"mobileCountry\":\"+91\",\"alternateNo\":null,\"passportNo\":null,\"dateOfBirth\":null,\"gender\":null,\"nationality\":null,\"maritalStatus\":null,\"address\":null,\"highestQual\":null,\"interestedCourse\":null,\"testsGiven\":[],\"interestedCountry\":null,\"intake\":null,\"applyLevel\":null,\"source\":\"Walk-in\",\"otherReference\":null,\"status\":\"NEW\",\"priority\":\"MEDIUM\",\"tags\":[],\"remark\":\"new student\\nVisit purpose: Study Abroad Enquiry\",\"lastRemark\":null,\"dropReason\":null,\"droppedAt\":null,\"convertedAt\":null,\"lastTouchedAt\":\"2026-07-04T07:32:08.470Z\",\"studentId\":null,\"leadId\":\"5a663213-88f8-4414-aa01-04ffe6779a75\",\"metadata\":{},\"createdAt\":\"2026-07-04T07:32:08.473Z\",\"updatedAt\":\"2026-07-04T07:32:08.473Z\",\"deletedAt\":null,\"createdBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"updatedBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\"}',NULL,NULL,'2026-07-04 07:32:08.487'),('aca0216f-d62c-4e0d-b822-b6153e44f454','f16e56db-fd62-4993-a487-7fb5906e5caf','LOGIN','User','f16e56db-fd62-4993-a487-7fb5906e5caf',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-07-06 11:55:27.264'),('b8c0678c-73dd-41e4-a36c-d8e75f610775','f16e56db-fd62-4993-a487-7fb5906e5caf','LOGIN','User','f16e56db-fd62-4993-a487-7fb5906e5caf',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-07-04 06:35:49.340'),('ba91d685-0502-4d35-93de-2f517ee1629e','f16e56db-fd62-4993-a487-7fb5906e5caf','CREATE','Lead','41c1ec0d-ff02-4741-9aa8-8acea690e181',NULL,'{\"leadCode\":\"MAIN-LEAD-2026-000002\",\"tokenNumber\":\"H-101\",\"status\":\"WAITING\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-07-06 07:45:07.571'),('cc4873dc-a521-4aca-be61-f8cae642aabc','f16e56db-fd62-4993-a487-7fb5906e5caf','UPDATE','enquiry','262f50e2-74a4-4475-8571-f55d77a9b8d8','{\"id\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"enquiryCode\":\"MAIN-ENQ000001\",\"branchId\":\"caabc1ee-3ff0-496c-802a-746bbbbae703\",\"assignedToId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"assignedById\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Darshil\",\"lastName\":\"Kachhadiya\",\"email\":\"kachhadiyadarshil2@gmail.com\",\"mobile\":\"8799338055\",\"mobileCountry\":\"+91\",\"alternateNo\":\"\",\"passportNo\":null,\"dateOfBirth\":null,\"gender\":\"Male\",\"nationality\":\"\",\"maritalStatus\":\"\",\"address\":\"\",\"highestQual\":\"\",\"interestedCourse\":\"\",\"testsGiven\":[],\"interestedCountry\":\"\",\"intake\":\"\",\"applyLevel\":\"\",\"source\":\"Walk-in\",\"otherReference\":\"\",\"status\":\"INTERESTED\",\"priority\":\"MEDIUM\",\"tags\":[],\"remark\":\"new student\\nVisit purpose: Study Abroad Enquiry\",\"lastRemark\":\"new student\\nVisit purpose: Study Abroad Enquiry\",\"dropReason\":null,\"droppedAt\":null,\"convertedAt\":null,\"lastTouchedAt\":\"2026-07-06T06:32:30.550Z\",\"studentId\":null,\"leadId\":\"5a663213-88f8-4414-aa01-04ffe6779a75\",\"metadata\":{},\"createdAt\":\"2026-07-04T07:32:08.473Z\",\"updatedAt\":\"2026-07-06T06:32:30.551Z\",\"deletedAt\":null,\"createdBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"updatedBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"branch\":{\"id\":\"caabc1ee-3ff0-496c-802a-746bbbbae703\",\"companyId\":\"a7c7c0df-60c6-4a73-88d0-92b2fa521655\",\"name\":\"Head Office\",\"code\":\"HQ\",\"email\":\"hq@crm.com\",\"phone\":null,\"address\":null,\"isActive\":true,\"createdAt\":\"2026-07-04T06:34:52.702Z\",\"updatedAt\":\"2026-07-04T06:46:04.568Z\",\"deletedAt\":null,\"createdBy\":null,\"updatedBy\":null},\"assignedTo\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"},\"assignedBy\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"},\"followups\":[],\"appointments\":[],\"demos\":[],\"notes\":[],\"documents\":[],\"communications\":[],\"student\":null,\"auditLogs\":[{\"id\":\"b8e0e003-42a5-4992-b3d1-d815c5f4d409\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"CONTACTED\",\"newValue\":\"INTERESTED\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:31:34.285Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"607332b0-5aca-4776-af85-1d4d8b711272\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"NEW\",\"newValue\":\"CONTACTED\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:31:12.523Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"f37e956a-22ba-4b43-991d-a490ef712b04\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"CONTACTED\",\"newValue\":\"NEW\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:31:10.638Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"d94c7827-e68e-43f3-9d75-3db8e1d83a0b\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"INTERESTED\",\"newValue\":\"CONTACTED\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:31:08.158Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"1e1669c2-16e5-4d8a-bcab-7fb56ebbf34e\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"UPDATE\",\"field\":\"interestedCourse\",\"oldValue\":\"\",\"newValue\":\"\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:05:41.832Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"fbe70671-528d-4118-9369-31f13a30325c\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"UPDATE\",\"field\":\"interestedCountry\",\"oldValue\":\"\",\"newValue\":\"\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:05:41.832Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"36eeb515-35f8-467a-b5f2-c3467d4ce44b\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"NEW\",\"newValue\":\"INTERESTED\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T05:25:31.562Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"795ee48e-a13e-49b0-9791-2bcee0255243\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"CREATE\",\"field\":null,\"oldValue\":null,\"newValue\":\"MAIN-ENQ000001\",\"description\":\"Qualified enquiry from walk-in MAIN-LEAD-2026-000001\",\"ipAddress\":null,\"createdAt\":\"2026-07-04T07:32:08.482Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}}]}','{\"id\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"enquiryCode\":\"MAIN-ENQ000001\",\"branchId\":\"caabc1ee-3ff0-496c-802a-746bbbbae703\",\"assignedToId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"assignedById\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Darshil\",\"lastName\":\"Kachhadiya\",\"email\":\"kachhadiyadarshil2@gmail.com\",\"mobile\":\"8799338055\",\"mobileCountry\":\"+91\",\"alternateNo\":\"\",\"passportNo\":null,\"dateOfBirth\":null,\"gender\":\"Male\",\"nationality\":\"India\",\"maritalStatus\":\"Single\",\"address\":\"A/120,Tirupati society near balagi bungalows, savaliya circle, yogi chowk , surat.\",\"highestQual\":\"\",\"interestedCourse\":\"MBA\",\"testsGiven\":[],\"interestedCountry\":\"Canada\",\"intake\":\"Jul-2026\",\"applyLevel\":\"\",\"source\":\"Walk-in\",\"otherReference\":\"12222\",\"status\":\"INTERESTED\",\"priority\":\"MEDIUM\",\"tags\":[\"IELTS\",\"CANADA\",\"AUSTRALIA\",\"VIP\",\"SCHOLARSHIP\"],\"remark\":\"new student\\nVisit purpose: Study Abroad Enquiry\",\"lastRemark\":\"new student\\nVisit purpose: Study Abroad Enquiry\",\"dropReason\":null,\"droppedAt\":null,\"convertedAt\":null,\"lastTouchedAt\":\"2026-07-06T06:33:34.951Z\",\"studentId\":null,\"leadId\":\"5a663213-88f8-4414-aa01-04ffe6779a75\",\"metadata\":{},\"createdAt\":\"2026-07-04T07:32:08.473Z\",\"updatedAt\":\"2026-07-06T06:33:34.953Z\",\"deletedAt\":null,\"createdBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"updatedBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-07-06 06:33:34.982'),('d5a0f69e-042b-474d-8e39-65f77e22f94a','f16e56db-fd62-4993-a487-7fb5906e5caf','LOGIN','User','f16e56db-fd62-4993-a487-7fb5906e5caf',NULL,NULL,'::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456','2026-07-06 05:24:15.069'),('d78290c7-be96-4ba5-a3f2-b95d23a1c2b3','f16e56db-fd62-4993-a487-7fb5906e5caf','UPDATE','enquiry','262f50e2-74a4-4475-8571-f55d77a9b8d8','{\"id\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"enquiryCode\":\"MAIN-ENQ000001\",\"branchId\":\"caabc1ee-3ff0-496c-802a-746bbbbae703\",\"assignedToId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"assignedById\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Darshil\",\"lastName\":\"Kachhadiya\",\"email\":\"kachhadiyadarshil2@gmail.com\",\"mobile\":\"8799338055\",\"mobileCountry\":\"+91\",\"alternateNo\":\"12333367\",\"passportNo\":null,\"dateOfBirth\":null,\"gender\":\"Male\",\"nationality\":\"India\",\"maritalStatus\":\"Single\",\"address\":\"A/120,Tirupati society near balagi bungalows, savaliya circle, yogi chowk , surat.\",\"highestQual\":\"\",\"interestedCourse\":\"MBA\",\"testsGiven\":[],\"interestedCountry\":\"Canada\",\"intake\":\"Jul-2026\",\"applyLevel\":\"\",\"source\":\"Walk-in\",\"otherReference\":\"12222\",\"status\":\"INTERESTED\",\"priority\":\"MEDIUM\",\"tags\":[\"IELTS\",\"CANADA\",\"AUSTRALIA\",\"VIP\",\"SCHOLARSHIP\"],\"remark\":\"new student\\nVisit purpose: Study Abroad Enquiry\",\"lastRemark\":\"new student\\nVisit purpose: Study Abroad Enquiry\",\"dropReason\":null,\"droppedAt\":null,\"convertedAt\":null,\"lastTouchedAt\":\"2026-07-06T06:33:42.045Z\",\"studentId\":null,\"leadId\":\"5a663213-88f8-4414-aa01-04ffe6779a75\",\"metadata\":{},\"createdAt\":\"2026-07-04T07:32:08.473Z\",\"updatedAt\":\"2026-07-06T06:33:42.046Z\",\"deletedAt\":null,\"createdBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"updatedBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"branch\":{\"id\":\"caabc1ee-3ff0-496c-802a-746bbbbae703\",\"companyId\":\"a7c7c0df-60c6-4a73-88d0-92b2fa521655\",\"name\":\"Head Office\",\"code\":\"HQ\",\"email\":\"hq@crm.com\",\"phone\":null,\"address\":null,\"isActive\":true,\"createdAt\":\"2026-07-04T06:34:52.702Z\",\"updatedAt\":\"2026-07-04T06:46:04.568Z\",\"deletedAt\":null,\"createdBy\":null,\"updatedBy\":null},\"assignedTo\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"},\"assignedBy\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"},\"followups\":[],\"appointments\":[],\"demos\":[],\"notes\":[],\"documents\":[],\"communications\":[],\"student\":null,\"auditLogs\":[{\"id\":\"0cf8b2bb-a7f4-4ac5-9049-169f847dcf06\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"UPDATE\",\"field\":\"interestedCourse\",\"oldValue\":\"\",\"newValue\":\"MBA\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:33:34.972Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"9e098f41-6a70-43f5-b731-3e52a3a27cba\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"UPDATE\",\"field\":\"interestedCountry\",\"oldValue\":\"\",\"newValue\":\"Canada\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:33:34.972Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"b8103bfe-8b6c-4635-8a55-c22b46f8da87\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"UPDATE\",\"field\":\"tags\",\"oldValue\":\"[]\",\"newValue\":\"[\\\"IELTS\\\",\\\"CANADA\\\",\\\"AUSTRALIA\\\",\\\"VIP\\\",\\\"SCHOLARSHIP\\\"]\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:33:34.972Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"b8e0e003-42a5-4992-b3d1-d815c5f4d409\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"CONTACTED\",\"newValue\":\"INTERESTED\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:31:34.285Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"607332b0-5aca-4776-af85-1d4d8b711272\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"NEW\",\"newValue\":\"CONTACTED\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:31:12.523Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"f37e956a-22ba-4b43-991d-a490ef712b04\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"CONTACTED\",\"newValue\":\"NEW\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:31:10.638Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"d94c7827-e68e-43f3-9d75-3db8e1d83a0b\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"INTERESTED\",\"newValue\":\"CONTACTED\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:31:08.158Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"1e1669c2-16e5-4d8a-bcab-7fb56ebbf34e\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"UPDATE\",\"field\":\"interestedCourse\",\"oldValue\":\"\",\"newValue\":\"\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:05:41.832Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"fbe70671-528d-4118-9369-31f13a30325c\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"UPDATE\",\"field\":\"interestedCountry\",\"oldValue\":\"\",\"newValue\":\"\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T06:05:41.832Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"36eeb515-35f8-467a-b5f2-c3467d4ce44b\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"STATUS_CHANGE\",\"field\":\"status\",\"oldValue\":\"NEW\",\"newValue\":\"INTERESTED\",\"description\":null,\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T05:25:31.562Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"795ee48e-a13e-49b0-9791-2bcee0255243\",\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"CREATE\",\"field\":null,\"oldValue\":null,\"newValue\":\"MAIN-ENQ000001\",\"description\":\"Qualified enquiry from walk-in MAIN-LEAD-2026-000001\",\"ipAddress\":null,\"createdAt\":\"2026-07-04T07:32:08.482Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}}]}','{\"id\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"enquiryCode\":\"MAIN-ENQ000001\",\"branchId\":\"caabc1ee-3ff0-496c-802a-746bbbbae703\",\"assignedToId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"assignedById\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Darshil\",\"lastName\":\"Kachhadiya\",\"email\":\"kachhadiyadarshil2@gmail.com\",\"mobile\":\"8799338055\",\"mobileCountry\":\"+91\",\"alternateNo\":\"12333367\",\"passportNo\":null,\"dateOfBirth\":\"2005-12-02T00:00:00.000Z\",\"gender\":\"Male\",\"nationality\":\"India\",\"maritalStatus\":\"Single\",\"address\":\"A/120,Tirupati society near balagi bungalows, savaliya circle, yogi chowk , surat.\",\"highestQual\":\"\",\"interestedCourse\":\"MBA\",\"testsGiven\":[],\"interestedCountry\":\"Canada\",\"intake\":\"Jul-2026\",\"applyLevel\":\"\",\"source\":\"Walk-in\",\"otherReference\":\"12222\",\"status\":\"INTERESTED\",\"priority\":\"MEDIUM\",\"tags\":[\"IELTS\",\"CANADA\",\"AUSTRALIA\",\"VIP\",\"SCHOLARSHIP\"],\"remark\":\"new student\\nVisit purpose: Study Abroad Enquiry\",\"lastRemark\":\"new student\\nVisit purpose: Study Abroad Enquiry\",\"dropReason\":null,\"droppedAt\":null,\"convertedAt\":null,\"lastTouchedAt\":\"2026-07-06T06:34:07.441Z\",\"studentId\":null,\"leadId\":\"5a663213-88f8-4414-aa01-04ffe6779a75\",\"metadata\":{},\"createdAt\":\"2026-07-04T07:32:08.473Z\",\"updatedAt\":\"2026-07-06T06:34:07.464Z\",\"deletedAt\":null,\"createdBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"updatedBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-07-06 06:34:07.477'),('dace903f-7be4-4856-9ff7-0a1a5bae56d5','f16e56db-fd62-4993-a487-7fb5906e5caf','UPDATE','enquiry','cf4ba80b-9f14-4321-aa4d-3c7c626ca345','{\"id\":\"cf4ba80b-9f14-4321-aa4d-3c7c626ca345\",\"enquiryCode\":\"MAIN-ENQ000002\",\"branchId\":\"caabc1ee-3ff0-496c-802a-746bbbbae703\",\"assignedToId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"assignedById\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Rahul\",\"lastName\":\"Patel\",\"email\":\"rahul.patel@test.com\",\"mobile\":\"1234567890\",\"mobileCountry\":\"+91\",\"alternateNo\":null,\"passportNo\":null,\"dateOfBirth\":null,\"gender\":null,\"nationality\":null,\"maritalStatus\":null,\"address\":null,\"highestQual\":null,\"interestedCourse\":null,\"testsGiven\":[],\"interestedCountry\":null,\"intake\":null,\"applyLevel\":null,\"source\":\"Walk-in\",\"otherReference\":null,\"status\":\"DEMO_SCHEDULED\",\"priority\":\"MEDIUM\",\"tags\":[],\"remark\":\"123\\nVisit purpose: Study Abroad Enquiry\",\"lastRemark\":null,\"dropReason\":null,\"droppedAt\":null,\"convertedAt\":null,\"lastTouchedAt\":\"2026-07-06T08:12:31.916Z\",\"studentId\":null,\"leadId\":\"41c1ec0d-ff02-4741-9aa8-8acea690e181\",\"metadata\":{},\"createdAt\":\"2026-07-06T07:45:07.595Z\",\"updatedAt\":\"2026-07-06T08:12:31.917Z\",\"deletedAt\":null,\"createdBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"updatedBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"branch\":{\"id\":\"caabc1ee-3ff0-496c-802a-746bbbbae703\",\"companyId\":\"a7c7c0df-60c6-4a73-88d0-92b2fa521655\",\"name\":\"Head Office\",\"code\":\"HQ\",\"email\":\"hq@crm.com\",\"phone\":null,\"address\":null,\"isActive\":true,\"createdAt\":\"2026-07-04T06:34:52.702Z\",\"updatedAt\":\"2026-07-04T06:46:04.568Z\",\"deletedAt\":null,\"createdBy\":null,\"updatedBy\":null},\"assignedTo\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"},\"assignedBy\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"},\"followups\":[],\"appointments\":[{\"id\":\"9dd376ab-b500-47e8-a58a-a054c564db89\",\"enquiryId\":\"cf4ba80b-9f14-4321-aa4d-3c7c626ca345\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"counsellorId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"title\":\"In-person Counselling\",\"remark\":\"csdcwscf\",\"room\":\"Room A\",\"mode\":\"OFFLINE\",\"platform\":null,\"meetingLink\":null,\"startAt\":\"2026-07-07T04:30:00.000Z\",\"endAt\":null,\"isCompleted\":false,\"createdAt\":\"2026-07-06T07:47:14.771Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"},\"counsellor\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}}],\"demos\":[{\"id\":\"f2ed8180-c086-4159-9996-18818c9966a9\",\"enquiryId\":\"cf4ba80b-9f14-4321-aa4d-3c7c626ca345\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"facultyId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"demoDate\":\"2026-07-07T04:30:00.000Z\",\"className\":\"IELTS Foundation\",\"batch\":\"Morning A\",\"attendance\":\"NOT_MARKED\",\"feedback\":null,\"result\":\"POSITIVE\",\"remark\":null,\"createdAt\":\"2026-07-06T08:12:31.912Z\",\"updatedAt\":\"2026-07-06T08:12:31.912Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"},\"faculty\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}}],\"notes\":[],\"documents\":[],\"communications\":[],\"student\":null,\"auditLogs\":[{\"id\":\"1dff4f93-f4d2-462b-9218-073ff189beb0\",\"enquiryId\":\"cf4ba80b-9f14-4321-aa4d-3c7c626ca345\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"DEMO\",\"field\":null,\"oldValue\":null,\"newValue\":null,\"description\":\"IELTS Foundation · Morning A · POSITIVE\",\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T08:12:31.922Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"a47415b6-1cf2-48e3-b681-2a4cb1dc5c8e\",\"enquiryId\":\"cf4ba80b-9f14-4321-aa4d-3c7c626ca345\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"APPOINTMENT\",\"field\":null,\"oldValue\":null,\"newValue\":\"csdcwscf\",\"description\":\"OFFLINE · Room A\",\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T07:47:14.788Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}},{\"id\":\"33b85968-299c-4908-94f0-549045ea0ffb\",\"enquiryId\":\"cf4ba80b-9f14-4321-aa4d-3c7c626ca345\",\"userId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"action\":\"CREATE\",\"field\":null,\"oldValue\":null,\"newValue\":\"MAIN-ENQ000002\",\"description\":\"Qualified enquiry from walk-in MAIN-LEAD-2026-000002\",\"ipAddress\":\"::1\",\"createdAt\":\"2026-07-06T07:45:07.609Z\",\"user\":{\"id\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"email\":\"admin@crm.com\"}}]}','{\"id\":\"cf4ba80b-9f14-4321-aa4d-3c7c626ca345\",\"enquiryCode\":\"MAIN-ENQ000002\",\"branchId\":\"caabc1ee-3ff0-496c-802a-746bbbbae703\",\"assignedToId\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"assignedById\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"firstName\":\"Rahul\",\"lastName\":\"Patel\",\"email\":\"rahul.patel@test.com\",\"mobile\":\"1234567890\",\"mobileCountry\":\"+91\",\"alternateNo\":\"\",\"passportNo\":null,\"dateOfBirth\":null,\"gender\":\"\",\"nationality\":\"\",\"maritalStatus\":\"\",\"address\":\"\",\"highestQual\":\"\",\"interestedCourse\":\"\",\"testsGiven\":[],\"interestedCountry\":\"\",\"intake\":\"\",\"applyLevel\":\"\",\"source\":\"Walk-in\",\"otherReference\":\"\",\"status\":\"DEMO_SCHEDULED\",\"priority\":\"MEDIUM\",\"tags\":[],\"remark\":\"123\\nVisit purpose: Study Abroad Enquiry\",\"lastRemark\":\"123\\nVisit purpose: Study Abroad Enquiry\",\"dropReason\":null,\"droppedAt\":null,\"convertedAt\":null,\"lastTouchedAt\":\"2026-07-06T08:53:17.174Z\",\"studentId\":null,\"leadId\":\"41c1ec0d-ff02-4741-9aa8-8acea690e181\",\"metadata\":{},\"createdAt\":\"2026-07-06T07:45:07.595Z\",\"updatedAt\":\"2026-07-06T08:53:17.177Z\",\"deletedAt\":null,\"createdBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"updatedBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-07-06 08:53:17.199'),('e72e5b35-0b27-4784-b30c-7727d484a40f','f16e56db-fd62-4993-a487-7fb5906e5caf','CREATE','Master:Country','f402dfd2-b07e-4119-8e3a-8af9b6f23f50',NULL,'{\"id\":\"f402dfd2-b07e-4119-8e3a-8af9b6f23f50\",\"companyId\":\"a7c7c0df-60c6-4a73-88d0-92b2fa521655\",\"code\":\"W1T_MSPNQ7S0\",\"name\":\"W1 Testland\",\"isoCode\":\"ZZ\",\"phoneCode\":\"+99\",\"currencyCode\":null,\"nationality\":null,\"description\":null,\"isActive\":true,\"sortOrder\":0,\"createdAt\":\"2026-08-12T05:37:04.268Z\",\"updatedAt\":\"2026-08-12T05:37:04.268Z\",\"deletedAt\":null,\"createdBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"updatedBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\"}','::1','node','2026-08-12 05:37:04.275'),('effe6e96-9cf1-490c-8c01-2956cf8a2604','f16e56db-fd62-4993-a487-7fb5906e5caf','STATUS_CHANGE','enquiry','262f50e2-74a4-4475-8571-f55d77a9b8d8','{\"status\":\"NEW\"}','{\"status\":\"CONTACTED\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-07-06 06:31:12.527'),('f11b3ec6-e783-4a05-b124-9fd5b1d062c6','f16e56db-fd62-4993-a487-7fb5906e5caf','DELETE','Master:Country','9760d19a-78d4-4c77-becc-3d787e529d2b','{\"id\":\"9760d19a-78d4-4c77-becc-3d787e529d2b\",\"companyId\":\"a7c7c0df-60c6-4a73-88d0-92b2fa521655\",\"code\":\"W1T_MSPO65JK\",\"name\":\"W1 Testland Updated\",\"isoCode\":\"ZZ\",\"phoneCode\":\"+99\",\"currencyCode\":null,\"nationality\":null,\"description\":null,\"isActive\":false,\"sortOrder\":0,\"createdAt\":\"2026-08-12T05:49:27.853Z\",\"updatedAt\":\"2026-08-12T05:49:27.965Z\",\"deletedAt\":null,\"createdBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\",\"updatedBy\":\"f16e56db-fd62-4993-a487-7fb5906e5caf\"}',NULL,'::1','node','2026-08-12 05:49:28.029'),('f1ae99c4-2623-4c59-b7d9-86b4ca974624','f16e56db-fd62-4993-a487-7fb5906e5caf','STATUS_CHANGE','enquiry','262f50e2-74a4-4475-8571-f55d77a9b8d8','{\"status\":\"CONTACTED\"}','{\"status\":\"NEW\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-07-06 06:31:10.641'),('f9147880-0e11-4336-ac1c-eee337b9c3c4','f16e56db-fd62-4993-a487-7fb5906e5caf','STATUS_CHANGE','enquiry','262f50e2-74a4-4475-8571-f55d77a9b8d8','{\"status\":\"CONTACTED\"}','{\"status\":\"INTERESTED\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','2026-07-06 06:31:34.288');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `branches`
--

DROP TABLE IF EXISTS `branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `branches` (
  `id` varchar(191) NOT NULL,
  `companyId` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  `addressLine1` varchar(191) DEFAULT NULL,
  `addressLine2` varchar(191) DEFAULT NULL,
  `city` varchar(191) DEFAULT NULL,
  `countryId` varchar(191) DEFAULT NULL,
  `managerId` varchar(191) DEFAULT NULL,
  `postalCode` varchar(191) DEFAULT NULL,
  `state` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `branches_companyId_code_key` (`companyId`,`code`),
  KEY `branches_companyId_idx` (`companyId`),
  KEY `branches_countryId_idx` (`countryId`),
  KEY `branches_managerId_idx` (`managerId`),
  CONSTRAINT `branches_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `branches_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `countries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `branches_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branches`
--

LOCK TABLES `branches` WRITE;
/*!40000 ALTER TABLE `branches` DISABLE KEYS */;
INSERT INTO `branches` VALUES ('caabc1ee-3ff0-496c-802a-746bbbbae703','a7c7c0df-60c6-4a73-88d0-92b2fa521655','Head Office','HQ','hq@crm.com',NULL,NULL,1,'2026-07-04 06:34:52.702','2026-07-04 06:46:04.568',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `branches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `communication_templates`
--

DROP TABLE IF EXISTS `communication_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `communication_templates` (
  `id` varchar(191) NOT NULL,
  `companyId` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `channel` varchar(191) DEFAULT NULL,
  `subject` varchar(191) DEFAULT NULL,
  `body` text DEFAULT NULL,
  `variables` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`variables`)),
  `eventType` varchar(191) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `communication_templates_companyId_code_key` (`companyId`,`code`),
  KEY `communication_templates_companyId_idx` (`companyId`),
  KEY `communication_templates_channel_idx` (`channel`),
  KEY `communication_templates_isActive_idx` (`isActive`),
  CONSTRAINT `communication_templates_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `communication_templates`
--

LOCK TABLES `communication_templates` WRITE;
/*!40000 ALTER TABLE `communication_templates` DISABLE KEYS */;
INSERT INTO `communication_templates` VALUES ('39e5f58f-7844-41d3-83cd-07d860f442df','a7c7c0df-60c6-4a73-88d0-92b2fa521655','TPL_FEE_DUE','Fee Due Reminder','EMAIL','Fee due reminder','Hi {{firstName}}, a fee of {{amount}} is due on {{dueDate}}.','[\"firstName\",\"amount\",\"dueDate\"]','FEE_DUE',NULL,1,7,'2026-08-11 12:55:29.608','2026-08-11 12:55:29.608',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('55673d1a-176e-4142-b676-3dd47e879967','a7c7c0df-60c6-4a73-88d0-92b2fa521655','TPL_DEMO_INVITE','Demo Invitation','EMAIL','Demo invitation','Hi {{firstName}}, you are invited to a demo session on {{demoDate}}.','[\"firstName\",\"demoDate\"]','DEMO_SCHEDULED',NULL,1,3,'2026-08-11 12:55:29.592','2026-08-11 12:55:29.592',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('7590364d-5806-4ab0-8a29-420b8e8e0df6','a7c7c0df-60c6-4a73-88d0-92b2fa521655','TPL_THANK_YOU_VISIT','Thank You After Visit','WHATSAPP',NULL,'Thank you for visiting us, {{firstName}}. We look forward to supporting your journey.','[\"firstName\"]','VISIT_COMPLETED',NULL,1,8,'2026-08-11 12:55:29.611','2026-08-11 12:55:29.611',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('785743ce-4c5b-4212-ac56-485350d73696','a7c7c0df-60c6-4a73-88d0-92b2fa521655','TPL_DOC_PENDING','Document Pending Alert','WHATSAPP',NULL,'Hi {{firstName}}, please submit pending documents: {{documentList}}.','[\"firstName\",\"documentList\"]','DOCUMENT_PENDING',NULL,1,4,'2026-08-11 12:55:29.596','2026-08-11 12:55:29.596',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('a5ba0781-65da-4f3a-ba07-01ee0c1a1e22','a7c7c0df-60c6-4a73-88d0-92b2fa521655','TPL_OFFER_RECEIVED','Offer Received','EMAIL','Offer received — {{universityName}}','Congratulations {{firstName}}! An offer has been received from {{universityName}}.','[\"firstName\",\"universityName\"]','OFFER_RECEIVED',NULL,1,5,'2026-08-11 12:55:29.599','2026-08-11 12:55:29.599',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('bbe23ec9-5178-48c3-b3a4-3c609375ce68','a7c7c0df-60c6-4a73-88d0-92b2fa521655','TPL_VISA_APPOINTMENT','Visa Appointment Reminder','SMS',NULL,'Reminder: visa appointment on {{appointmentDate}} at {{location}}.','[\"appointmentDate\",\"location\"]','VISA_APPOINTMENT',NULL,1,6,'2026-08-11 12:55:29.603','2026-08-11 12:55:29.603',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('bc20d1a1-6b21-4ce7-8955-a073d2d077ba','a7c7c0df-60c6-4a73-88d0-92b2fa521655','TPL_WELCOME_SMS','Welcome SMS','SMS',NULL,'Welcome {{firstName}}! Thank you for contacting us. Your counsellor will reach out shortly.','[\"firstName\"]','ENQUIRY_CREATED',NULL,1,1,'2026-08-11 12:55:29.580','2026-08-11 12:55:29.580',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('d609b97c-7037-4825-902a-e2b5a7afdfd2','a7c7c0df-60c6-4a73-88d0-92b2fa521655','TPL_FOLLOWUP_REMINDER','Follow-up Reminder','EMAIL','Follow-up reminder — {{enquiryCode}}','Hi {{firstName}}, this is a reminder about your scheduled follow-up on {{followUpDate}}.','[\"firstName\",\"enquiryCode\",\"followUpDate\"]','FOLLOWUP_DUE',NULL,1,2,'2026-08-11 12:55:29.586','2026-08-11 12:55:29.586',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf');
/*!40000 ALTER TABLE `communication_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companies`
--

DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `companies` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `logo` varchar(191) DEFAULT NULL,
  `website` varchar(191) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `addressLine1` varchar(191) DEFAULT NULL,
  `addressLine2` varchar(191) DEFAULT NULL,
  `city` varchar(191) DEFAULT NULL,
  `countryId` varchar(191) DEFAULT NULL,
  `legalName` varchar(191) DEFAULT NULL,
  `postalCode` varchar(191) DEFAULT NULL,
  `registrationNumber` varchar(191) DEFAULT NULL,
  `state` varchar(191) DEFAULT NULL,
  `taxNumber` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `companies_code_key` (`code`),
  KEY `companies_code_idx` (`code`),
  KEY `companies_countryId_idx` (`countryId`),
  CONSTRAINT `companies_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `countries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companies`
--

LOCK TABLES `companies` WRITE;
/*!40000 ALTER TABLE `companies` DISABLE KEYS */;
INSERT INTO `companies` VALUES ('a7c7c0df-60c6-4a73-88d0-92b2fa521655','Lead Management CRM','MAIN','admin@crm.com',NULL,NULL,NULL,NULL,1,'2026-07-04 06:34:52.695','2026-07-04 06:46:04.560',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `companies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `counselling_sessions`
--

DROP TABLE IF EXISTS `counselling_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `counselling_sessions` (
  `id` varchar(191) NOT NULL,
  `leadId` varchar(191) NOT NULL,
  `counsellorId` varchar(191) NOT NULL,
  `branchId` varchar(191) NOT NULL,
  `status` enum('ACTIVE','COMPLETED','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  `startedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `endedAt` datetime(3) DEFAULT NULL,
  `durationMinutes` int(11) DEFAULT NULL,
  `outcome` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `counselling_sessions_leadId_idx` (`leadId`),
  KEY `counselling_sessions_counsellorId_idx` (`counsellorId`),
  KEY `counselling_sessions_branchId_idx` (`branchId`),
  KEY `counselling_sessions_status_idx` (`status`),
  CONSTRAINT `counselling_sessions_counsellorId_fkey` FOREIGN KEY (`counsellorId`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `counselling_sessions_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `leads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `counselling_sessions`
--

LOCK TABLES `counselling_sessions` WRITE;
/*!40000 ALTER TABLE `counselling_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `counselling_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `counsellor_presence`
--

DROP TABLE IF EXISTS `counsellor_presence`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `counsellor_presence` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `branchId` varchar(191) NOT NULL,
  `status` enum('AVAILABLE','BUSY','IN_COUNSELLING','MEETING','BREAK','LUNCH','TRAINING','LEAVE','OFFLINE','DND','WFH') NOT NULL DEFAULT 'OFFLINE',
  `maxDailyCapacity` int(11) NOT NULL DEFAULT 20,
  `todayAssigned` int(11) NOT NULL DEFAULT 0,
  `lastHeartbeatAt` datetime(3) DEFAULT NULL,
  `lastAssignedAt` datetime(3) DEFAULT NULL,
  `skills` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`skills`)),
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`metadata`)),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `counsellor_presence_userId_key` (`userId`),
  KEY `counsellor_presence_branchId_idx` (`branchId`),
  KEY `counsellor_presence_status_idx` (`status`),
  CONSTRAINT `counsellor_presence_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `counsellor_presence_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `counsellor_presence`
--

LOCK TABLES `counsellor_presence` WRITE;
/*!40000 ALTER TABLE `counsellor_presence` DISABLE KEYS */;
/*!40000 ALTER TABLE `counsellor_presence` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `counsellor_skills`
--

DROP TABLE IF EXISTS `counsellor_skills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `counsellor_skills` (
  `id` varchar(191) NOT NULL,
  `companyId` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `counsellor_skills_companyId_code_key` (`companyId`,`code`),
  KEY `counsellor_skills_companyId_idx` (`companyId`),
  KEY `counsellor_skills_isActive_idx` (`isActive`),
  CONSTRAINT `counsellor_skills_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `counsellor_skills`
--

LOCK TABLES `counsellor_skills` WRITE;
/*!40000 ALTER TABLE `counsellor_skills` DISABLE KEYS */;
INSERT INTO `counsellor_skills` VALUES ('1df6b6b4-0900-46fc-9836-ca7bfaba475f','a7c7c0df-60c6-4a73-88d0-92b2fa521655','FOLLOW_UP','Follow-up',NULL,1,9,'2026-08-11 12:55:28.870','2026-08-11 12:55:28.870',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('3b32ef6e-6f66-446c-87e2-46cdb5c59698','a7c7c0df-60c6-4a73-88d0-92b2fa521655','IELTS_GUIDANCE','IELTS Guidance',NULL,1,7,'2026-08-11 12:55:28.864','2026-08-11 12:55:28.864',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('433485c6-4328-42df-9879-ae769fd87d2a','a7c7c0df-60c6-4a73-88d0-92b2fa521655','APPLICATION_PROCESSING','Application Processing',NULL,1,4,'2026-08-11 12:55:28.852','2026-08-11 12:55:28.852',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('80d0bbe0-6610-4657-9fd0-1cdbf2b25fd7','a7c7c0df-60c6-4a73-88d0-92b2fa521655','INTERVIEW_PREPARATION','Interview Preparation',NULL,1,6,'2026-08-11 12:55:28.860','2026-08-11 12:55:28.860',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('9ca9bf45-b9a5-47dc-9fea-3c0f35097345','a7c7c0df-60c6-4a73-88d0-92b2fa521655','VISA_COUNSELLING','Visa Counselling',NULL,1,3,'2026-08-11 12:55:28.849','2026-08-11 12:55:28.849',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('a7d95f98-16e7-4787-acf2-6f44a8799736','a7c7c0df-60c6-4a73-88d0-92b2fa521655','DOCUMENTATION','Documentation',NULL,1,5,'2026-08-11 12:55:28.857','2026-08-11 12:55:28.857',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('cd8ccc5b-e14b-4c8a-97e6-163dbe8f5d0c','a7c7c0df-60c6-4a73-88d0-92b2fa521655','STUDENT_COUNSELLING','Student Counselling',NULL,1,1,'2026-08-11 12:55:28.840','2026-08-11 12:55:28.840',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('d68fc5c2-3dee-4c57-9855-756224b83d27','a7c7c0df-60c6-4a73-88d0-92b2fa521655','CAREER_GUIDANCE','Career Guidance',NULL,1,8,'2026-08-11 12:55:28.867','2026-08-11 12:55:28.867',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('efc1cddb-f4b2-40d2-905e-8a1571f99796','a7c7c0df-60c6-4a73-88d0-92b2fa521655','UNIVERSITY_COUNSELLING','University Counselling',NULL,1,2,'2026-08-11 12:55:28.845','2026-08-11 12:55:28.845',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf');
/*!40000 ALTER TABLE `counsellor_skills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `countries`
--

DROP TABLE IF EXISTS `countries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `countries` (
  `id` varchar(191) NOT NULL,
  `companyId` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `isoCode` varchar(191) DEFAULT NULL,
  `phoneCode` varchar(191) DEFAULT NULL,
  `currencyCode` varchar(191) DEFAULT NULL,
  `nationality` varchar(191) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `countries_companyId_code_key` (`companyId`,`code`),
  KEY `countries_companyId_idx` (`companyId`),
  KEY `countries_isActive_idx` (`isActive`),
  CONSTRAINT `countries_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `countries`
--

LOCK TABLES `countries` WRITE;
/*!40000 ALTER TABLE `countries` DISABLE KEYS */;
INSERT INTO `countries` VALUES ('10ed19e8-91f6-4c4d-bba9-603ece0ae33e','a7c7c0df-60c6-4a73-88d0-92b2fa521655','SG','Singapore','SG','+65','SGD','Singaporean',NULL,1,21,'2026-08-11 12:55:28.502','2026-08-11 12:55:28.502',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('2b197c8e-c7f1-4215-92c1-2fd89b21d4ae','a7c7c0df-60c6-4a73-88d0-92b2fa521655','AU','Australia','AU','+61','AUD','Australian',NULL,1,5,'2026-08-11 12:55:28.412','2026-08-11 12:55:28.412',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('35fe81d0-c3c6-44a5-a619-8e726b6d73a3','a7c7c0df-60c6-4a73-88d0-92b2fa521655','BE','Belgium','BE','+32','EUR','Belgian',NULL,1,19,'2026-08-11 12:55:28.491','2026-08-11 12:55:28.491',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('36024ebc-f3f5-4864-8f83-845766b2806d','a7c7c0df-60c6-4a73-88d0-92b2fa521655','IT','Italy','IT','+39','EUR','Italian',NULL,1,10,'2026-08-11 12:55:28.439','2026-08-11 12:55:28.439',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('4065ffec-5686-449d-bd33-d5d89a8a5a86','a7c7c0df-60c6-4a73-88d0-92b2fa521655','SE','Sweden','SE','+46','SEK','Swedish',NULL,1,13,'2026-08-11 12:55:28.458','2026-08-11 12:55:28.458',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('4b35383b-2fc4-40bc-8592-e19b9cf04222','a7c7c0df-60c6-4a73-88d0-92b2fa521655','CA','Canada','CA','+1','CAD','Canadian',NULL,1,4,'2026-08-11 12:55:28.406','2026-08-11 12:55:28.406',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('53bed249-19d8-405d-9731-33838c0a3ed2','a7c7c0df-60c6-4a73-88d0-92b2fa521655','MY','Malaysia','MY','+60','MYR','Malaysian',NULL,1,22,'2026-08-11 12:55:28.508','2026-08-11 12:55:28.508',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('5fd9a8e4-0869-42f4-969b-6c02591faed0','a7c7c0df-60c6-4a73-88d0-92b2fa521655','FI','Finland','FI','+358','EUR','Finnish',NULL,1,14,'2026-08-11 12:55:28.463','2026-08-11 12:55:28.463',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('6062255c-4a0c-41b9-ba12-35111e6325fe','a7c7c0df-60c6-4a73-88d0-92b2fa521655','IE','Ireland','IE','+353','EUR','Irish',NULL,1,7,'2026-08-11 12:55:28.422','2026-08-11 12:55:28.422',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('62a01f5f-05df-43f3-a430-8539fad67e22','a7c7c0df-60c6-4a73-88d0-92b2fa521655','GB','United Kingdom','GB','+44','GBP','British',NULL,1,2,'2026-08-11 12:55:28.391','2026-08-11 12:55:28.391',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('73b62964-fa3a-4a88-bfe7-7e2dc76e0363','a7c7c0df-60c6-4a73-88d0-92b2fa521655','CH','Switzerland','CH','+41','CHF','Swiss',NULL,1,17,'2026-08-11 12:55:28.479','2026-08-11 12:55:28.479',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('7558a054-c6c6-4e4e-83b3-90a861ae6e2f','a7c7c0df-60c6-4a73-88d0-92b2fa521655','ES','Spain','ES','+34','EUR','Spanish',NULL,1,11,'2026-08-11 12:55:28.446','2026-08-11 12:55:28.446',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('7964bf8f-1156-4faa-8736-aa4eee7826a7','a7c7c0df-60c6-4a73-88d0-92b2fa521655','AT','Austria','AT','+43','EUR','Austrian',NULL,1,18,'2026-08-11 12:55:28.485','2026-08-11 12:55:28.485',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('7eb03fa6-9f3c-4d5b-af81-6d8ac941b172','a7c7c0df-60c6-4a73-88d0-92b2fa521655','AE','UAE','AE','+971','AED','Emirati',NULL,1,20,'2026-08-11 12:55:28.497','2026-08-11 12:55:28.497',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('863cd63d-2281-4b42-80c8-9fa3ac3e2e89','a7c7c0df-60c6-4a73-88d0-92b2fa521655','DE','Germany','DE','+49','EUR','German',NULL,1,8,'2026-08-11 12:55:28.428','2026-08-11 12:55:28.428',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('9760d19a-78d4-4c77-becc-3d787e529d2b','a7c7c0df-60c6-4a73-88d0-92b2fa521655','W1T_MSPO65JK','W1 Testland Updated','ZZ','+99',NULL,NULL,NULL,0,0,'2026-08-12 05:49:27.853','2026-08-12 05:49:28.021','2026-08-12 05:49:28.020','f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('a7835d0b-c21d-4d12-a1ed-f92ad34b1e0b','a7c7c0df-60c6-4a73-88d0-92b2fa521655','NO','Norway','NO','+47','NOK','Norwegian',NULL,1,16,'2026-08-11 12:55:28.474','2026-08-11 12:55:28.474',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('b124086d-33e9-494f-8794-58f4a6e03072','a7c7c0df-60c6-4a73-88d0-92b2fa521655','US','United States','US','+1','USD','American',NULL,1,3,'2026-08-11 12:55:28.400','2026-08-11 12:55:28.400',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('cfffb8e3-22dd-4cf2-a842-f2093f32973e','a7c7c0df-60c6-4a73-88d0-92b2fa521655','FR','France','FR','+33','EUR','French',NULL,1,9,'2026-08-11 12:55:28.434','2026-08-11 12:55:28.434',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('dd34bffe-780f-44f8-9335-4316700b0b26','a7c7c0df-60c6-4a73-88d0-92b2fa521655','NZ','New Zealand','NZ','+64','NZD','New Zealander',NULL,1,6,'2026-08-11 12:55:28.417','2026-08-11 12:55:28.417',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('e0248398-d582-45c2-8418-649d99ed15c0','a7c7c0df-60c6-4a73-88d0-92b2fa521655','IN','India','IN','+91','INR','Indian',NULL,1,1,'2026-08-11 12:55:28.383','2026-08-11 12:55:28.383',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('e2fc5574-4d75-407a-b076-e6fd9d126d45','a7c7c0df-60c6-4a73-88d0-92b2fa521655','NL','Netherlands','NL','+31','EUR','Dutch',NULL,1,12,'2026-08-11 12:55:28.451','2026-08-11 12:55:28.451',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('f285429b-7bfa-49a6-a78a-74abb2e09b72','a7c7c0df-60c6-4a73-88d0-92b2fa521655','DK','Denmark','DK','+45','DKK','Danish',NULL,1,15,'2026-08-11 12:55:28.469','2026-08-11 12:55:28.469',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('f402dfd2-b07e-4119-8e3a-8af9b6f23f50','a7c7c0df-60c6-4a73-88d0-92b2fa521655','W1T_MSPNQ7S0','W1 Testland Updated','ZZ','+99',NULL,NULL,NULL,0,0,'2026-08-12 05:37:04.268','2026-08-12 05:37:04.437','2026-08-12 05:37:04.436','f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf');
/*!40000 ALTER TABLE `countries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `courses` (
  `id` varchar(191) NOT NULL,
  `companyId` varchar(191) NOT NULL,
  `universityId` varchar(191) NOT NULL,
  `countryId` varchar(191) DEFAULT NULL,
  `code` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `level` varchar(191) DEFAULT NULL,
  `discipline` varchar(191) DEFAULT NULL,
  `duration` decimal(8,2) DEFAULT NULL,
  `durationUnit` varchar(191) DEFAULT NULL,
  `tuitionFee` decimal(14,2) DEFAULT NULL,
  `currencyCode` varchar(191) DEFAULT NULL,
  `intakeAvailable` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `courses_companyId_code_key` (`companyId`,`code`),
  KEY `courses_companyId_idx` (`companyId`),
  KEY `courses_universityId_idx` (`universityId`),
  KEY `courses_countryId_idx` (`countryId`),
  KEY `courses_isActive_idx` (`isActive`),
  CONSTRAINT `courses_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `courses_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `countries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `courses_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `universities` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
INSERT INTO `courses` VALUES ('0767136f-7be9-4136-8b18-8b48b11f872b','a7c7c0df-60c6-4a73-88d0-92b2fa521655','5796f0fb-e8c1-4c64-9d22-d5c074358c03','6062255c-4a0c-41b9-ba12-35111e6325fe','COURSE_MBA_UCD','MBA','Masters','Business',NULL,NULL,NULL,NULL,NULL,NULL,1,24,'2026-08-11 12:55:29.327','2026-08-11 12:55:29.327',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('08a0ee0f-6e97-4f99-a31c-30269b375d0a','a7c7c0df-60c6-4a73-88d0-92b2fa521655','f9947934-7236-429d-9467-4475d1ef06ed','4b35383b-2fc4-40bc-8592-e19b9cf04222','COURSE_BSC_CS_CONCORDIA','BSc Computer Science','Bachelors','Computer Science',NULL,NULL,NULL,NULL,NULL,NULL,1,3,'2026-08-11 12:55:29.236','2026-08-11 12:55:29.236',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('144bde59-0c5a-4d1a-92b5-8fd73dabed57','a7c7c0df-60c6-4a73-88d0-92b2fa521655','f771458e-4854-48ad-a4ee-ef485e35879e','4b35383b-2fc4-40bc-8592-e19b9cf04222','COURSE_ENG_ALBERTA','Mechanical Engineering','Bachelors','Engineering',NULL,NULL,NULL,NULL,NULL,NULL,1,7,'2026-08-11 12:55:29.255','2026-08-11 12:55:29.255',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('16b8e0b1-1452-4bf2-9c91-d4b7543e3aeb','a7c7c0df-60c6-4a73-88d0-92b2fa521655','030e42e3-febb-4ed5-9e48-9528ed914613','62a01f5f-05df-43f3-a430-8539fad67e22','COURSE_MBA_MANCHESTER','MBA','Masters','Business',NULL,NULL,NULL,NULL,NULL,NULL,1,10,'2026-08-11 12:55:29.267','2026-08-11 12:55:29.267',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('16f0bb4d-538a-4a18-a768-0aa260376436','a7c7c0df-60c6-4a73-88d0-92b2fa521655','6676642f-d48e-4411-b73e-3173d38d5a56','62a01f5f-05df-43f3-a430-8539fad67e22','COURSE_IT_COVENTRY','Information Technology','Masters','IT',NULL,NULL,NULL,NULL,NULL,NULL,1,12,'2026-08-11 12:55:29.276','2026-08-11 12:55:29.276',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('19a5f623-97f8-4fd3-b583-af7646d06f70','a7c7c0df-60c6-4a73-88d0-92b2fa521655','0b7f380c-a0b4-476f-878a-b8ddd440a4aa','863cd63d-2281-4b42-80c8-9fa3ac3e2e89','COURSE_CS_TUM','MSc Computer Science','Masters','Computer Science',NULL,NULL,NULL,NULL,NULL,NULL,1,22,'2026-08-11 12:55:29.318','2026-08-11 12:55:29.318',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('204c0c4c-c87b-4b52-94b7-c44268721c37','a7c7c0df-60c6-4a73-88d0-92b2fa521655','45387156-d233-427c-b370-b37366ee8898','4b35383b-2fc4-40bc-8592-e19b9cf04222','COURSE_MSC_DS_UBC','MS Data Science','Masters','Data Science',NULL,NULL,NULL,NULL,NULL,NULL,1,5,'2026-08-11 12:55:29.247','2026-08-11 12:55:29.247',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('25162249-ce17-48ef-8083-4c4725795e92','a7c7c0df-60c6-4a73-88d0-92b2fa521655','9073e47b-84ec-4b5e-b2d7-7d9d1f98a2ac','b124086d-33e9-494f-8794-58f4a6e03072','COURSE_CS_STANFORD','MSc Computer Science','Masters','Computer Science',NULL,NULL,NULL,NULL,NULL,NULL,1,19,'2026-08-11 12:55:29.305','2026-08-11 12:55:29.305',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('284de1e1-c62f-40cc-af30-088c643dea7c','a7c7c0df-60c6-4a73-88d0-92b2fa521655','bd37ebf1-bb11-4493-bcb5-55537389368a','2b197c8e-c7f1-4215-92c1-2fd89b21d4ae','COURSE_MBA_MELBOURNE','MBA','Masters','Business',NULL,NULL,NULL,NULL,NULL,NULL,1,14,'2026-08-11 12:55:29.283','2026-08-11 12:55:29.283',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('31363a60-2564-482c-aa66-d5dbcbf499f5','a7c7c0df-60c6-4a73-88d0-92b2fa521655','ce2fc06c-cee0-4613-b990-703f2c5f3d30','53bed249-19d8-405d-9731-33838c0a3ed2','COURSE_CIVIL_MALAYA','Civil Engineering','Bachelors','Engineering',NULL,NULL,NULL,NULL,NULL,NULL,1,33,'2026-08-11 12:55:29.364','2026-08-11 12:55:29.364',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('32fcb94e-06c3-444b-a85a-2ba903dde3ab','a7c7c0df-60c6-4a73-88d0-92b2fa521655','cdf06af2-3ac1-41ba-901a-b531775f8248','10ed19e8-91f6-4c4d-bba9-603ece0ae33e','COURSE_IT_NUS','Information Technology','Masters','IT',NULL,NULL,NULL,NULL,NULL,NULL,1,27,'2026-08-11 12:55:29.339','2026-08-11 12:55:29.339',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('38a62a76-ea49-4555-962e-f196122a5b86','a7c7c0df-60c6-4a73-88d0-92b2fa521655','d21ce12c-2f24-4971-aa51-20dc73983ca7','2b197c8e-c7f1-4215-92c1-2fd89b21d4ae','COURSE_HOTEL_SYDNEY','Hotel Management','Bachelors','Hospitality',NULL,NULL,NULL,NULL,NULL,NULL,1,31,'2026-08-11 12:55:29.356','2026-08-11 12:55:29.356',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('3afc100c-6061-456b-a295-1bba564ae915','a7c7c0df-60c6-4a73-88d0-92b2fa521655','030e42e3-febb-4ed5-9e48-9528ed914613','62a01f5f-05df-43f3-a430-8539fad67e22','COURSE_MSC_CS_MANCHESTER','MSc Computer Science','Masters','Computer Science',NULL,NULL,NULL,NULL,NULL,NULL,1,9,'2026-08-11 12:55:29.263','2026-08-11 12:55:29.263',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('4188a741-5f70-4def-8881-a17e35937bd2','a7c7c0df-60c6-4a73-88d0-92b2fa521655','f9947934-7236-429d-9467-4475d1ef06ed','4b35383b-2fc4-40bc-8592-e19b9cf04222','COURSE_MBA_CONCORDIA','MBA','Masters','Business',NULL,NULL,NULL,NULL,NULL,NULL,1,4,'2026-08-11 12:55:29.243','2026-08-11 12:55:29.243',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('4dd66708-de67-4975-866c-c6614ffc5ac5','a7c7c0df-60c6-4a73-88d0-92b2fa521655','5796f0fb-e8c1-4c64-9d22-d5c074358c03','6062255c-4a0c-41b9-ba12-35111e6325fe','COURSE_CS_UCD','MSc Computer Science','Masters','Computer Science',NULL,NULL,NULL,NULL,NULL,NULL,1,25,'2026-08-11 12:55:29.331','2026-08-11 12:55:29.331',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('531b6ce6-8815-463f-a17e-56d4be541b11','a7c7c0df-60c6-4a73-88d0-92b2fa521655','94618ce9-6bb9-4e97-a41d-003bdb93e0f9','cfffb8e3-22dd-4cf2-a842-f2093f32973e','COURSE_MBA_SORBONNE','MBA','Masters','Business',NULL,NULL,NULL,NULL,NULL,NULL,1,34,'2026-08-11 12:55:29.368','2026-08-11 12:55:29.368',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('57ad6ae4-c688-4059-8570-870bd18cb760','a7c7c0df-60c6-4a73-88d0-92b2fa521655','6676642f-d48e-4411-b73e-3173d38d5a56','62a01f5f-05df-43f3-a430-8539fad67e22','COURSE_DIP_BUS_COVENTRY','Diploma in Business','Diploma','Business',NULL,NULL,NULL,NULL,NULL,NULL,1,29,'2026-08-11 12:55:29.347','2026-08-11 12:55:29.347',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('5bd8955f-f50c-419a-bf79-ba1deaf59c7c','a7c7c0df-60c6-4a73-88d0-92b2fa521655','aaa09c9f-f6de-43d3-89e3-f0b8c50ad8dc','e2fc5574-4d75-407a-b076-e6fd9d126d45','COURSE_DESIGN_AMSTERDAM','Graphic Design','Bachelors','Design',NULL,NULL,NULL,NULL,NULL,NULL,1,32,'2026-08-11 12:55:29.360','2026-08-11 12:55:29.360',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('6a87fb94-2ad4-4b5e-a6dc-66004276f166','a7c7c0df-60c6-4a73-88d0-92b2fa521655','e73054b1-778a-4371-b5e6-ea3c3702222d','4b35383b-2fc4-40bc-8592-e19b9cf04222','COURSE_MBA_TORONTO','MBA','Masters','Business',NULL,NULL,NULL,NULL,NULL,NULL,1,1,'2026-08-11 12:55:29.226','2026-08-11 12:55:29.226',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('7a0b3d72-a80d-4366-9f20-2d987d59c41f','a7c7c0df-60c6-4a73-88d0-92b2fa521655','6676642f-d48e-4411-b73e-3173d38d5a56','62a01f5f-05df-43f3-a430-8539fad67e22','COURSE_FOUNDATION_COVENTRY','Foundation Program','Foundation','General',NULL,NULL,NULL,NULL,NULL,NULL,1,30,'2026-08-11 12:55:29.351','2026-08-11 12:55:29.351',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('7e38f0fe-54ad-44ce-ac04-cb339d1c60ad','a7c7c0df-60c6-4a73-88d0-92b2fa521655','1d9ee59c-049a-4ffc-a5b2-ed4ea05786ee','863cd63d-2281-4b42-80c8-9fa3ac3e2e89','COURSE_MED_HEIDELBERG','Medicine Foundation','Foundation','Health',NULL,NULL,NULL,NULL,NULL,NULL,1,23,'2026-08-11 12:55:29.323','2026-08-11 12:55:29.323',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('8a844478-c56c-4077-b249-799a554214b3','a7c7c0df-60c6-4a73-88d0-92b2fa521655','0b7f380c-a0b4-476f-878a-b8ddd440a4aa','863cd63d-2281-4b42-80c8-9fa3ac3e2e89','COURSE_MECH_TUM','Mechanical Engineering','Masters','Engineering',NULL,NULL,NULL,NULL,NULL,NULL,1,21,'2026-08-11 12:55:29.314','2026-08-11 12:55:29.314',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('929efd09-93dc-41d8-826e-26aff6916847','a7c7c0df-60c6-4a73-88d0-92b2fa521655','759f5a9d-2a01-4b81-892b-82a1ffff17ab','2b197c8e-c7f1-4215-92c1-2fd89b21d4ae','COURSE_DS_UNSW','MS Data Science','Masters','Data Science',NULL,NULL,NULL,NULL,NULL,NULL,1,17,'2026-08-11 12:55:29.296','2026-08-11 12:55:29.296',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('99eefff6-5a93-4a53-a7b0-e3e88fc7bed3','a7c7c0df-60c6-4a73-88d0-92b2fa521655','8cdb5e14-8dcc-437a-89e5-886b208b577c','b124086d-33e9-494f-8794-58f4a6e03072','COURSE_MBA_HARVARD','MBA','Masters','Business',NULL,NULL,NULL,NULL,NULL,NULL,1,18,'2026-08-11 12:55:29.300','2026-08-11 12:55:29.300',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('9d3c2244-8698-419d-b707-c55d00bea71b','a7c7c0df-60c6-4a73-88d0-92b2fa521655','a72af79c-144c-490a-a41f-86df0306b2f0','4b35383b-2fc4-40bc-8592-e19b9cf04222','COURSE_MBA_MCGILL','MBA','Masters','Business',NULL,NULL,NULL,NULL,NULL,NULL,1,8,'2026-08-11 12:55:29.260','2026-08-11 12:55:29.260',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('9f995b40-1da5-4a61-bf33-bc32b4e79d9d','a7c7c0df-60c6-4a73-88d0-92b2fa521655','cdf06af2-3ac1-41ba-901a-b531775f8248','10ed19e8-91f6-4c4d-bba9-603ece0ae33e','COURSE_BA_NUS','Business Analytics','Masters','Analytics',NULL,NULL,NULL,NULL,NULL,NULL,1,28,'2026-08-11 12:55:29.344','2026-08-11 12:55:29.344',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('a14412a2-496e-4e11-8df1-68511ee856f7','a7c7c0df-60c6-4a73-88d0-92b2fa521655','e73054b1-778a-4371-b5e6-ea3c3702222d','4b35383b-2fc4-40bc-8592-e19b9cf04222','COURSE_MSC_CS_TORONTO','MSc Computer Science','Masters','Computer Science',NULL,NULL,NULL,NULL,NULL,NULL,1,2,'2026-08-11 12:55:29.232','2026-08-11 12:55:29.232',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('b1c9aba1-4ad2-4525-b6fd-5b5abff93b2f','a7c7c0df-60c6-4a73-88d0-92b2fa521655','d83b2580-8de4-4e02-8ec8-3040c5426389','62a01f5f-05df-43f3-a430-8539fad67e22','COURSE_LLM_LEEDS','LLM','Masters','Law',NULL,NULL,NULL,NULL,NULL,NULL,1,13,'2026-08-11 12:55:29.280','2026-08-11 12:55:29.280',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('cd3df170-02c0-44f7-b099-7426be5d02d3','a7c7c0df-60c6-4a73-88d0-92b2fa521655','adc91527-06e0-45cc-a5a8-055d76903bd2','62a01f5f-05df-43f3-a430-8539fad67e22','COURSE_BA_BIRMINGHAM','Business Analytics','Masters','Analytics',NULL,NULL,NULL,NULL,NULL,NULL,1,11,'2026-08-11 12:55:29.271','2026-08-11 12:55:29.271',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('df5fe73d-3afd-439e-8943-677a9e9dc7eb','a7c7c0df-60c6-4a73-88d0-92b2fa521655','364150ce-1107-4758-8d70-dd491032a343','dd34bffe-780f-44f8-9335-4316700b0b26','COURSE_MBA_AUCKLAND','MBA','Masters','Business',NULL,NULL,NULL,NULL,NULL,NULL,1,26,'2026-08-11 12:55:29.334','2026-08-11 12:55:29.334',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('e4ce1ed1-2868-4619-9579-2b03c22b78b6','a7c7c0df-60c6-4a73-88d0-92b2fa521655','0b7f380c-a0b4-476f-878a-b8ddd440a4aa','863cd63d-2281-4b42-80c8-9fa3ac3e2e89','COURSE_AUTO_TUM','Automobile Engineering','Masters','Engineering',NULL,NULL,NULL,NULL,NULL,NULL,1,35,'2026-08-11 12:55:29.373','2026-08-11 12:55:29.373',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('e5deda03-7ca0-49ba-8c9b-f783698da8ed','a7c7c0df-60c6-4a73-88d0-92b2fa521655','d21ce12c-2f24-4971-aa51-20dc73983ca7','2b197c8e-c7f1-4215-92c1-2fd89b21d4ae','COURSE_ARCH_SYDNEY','Architecture','Masters','Architecture',NULL,NULL,NULL,NULL,NULL,NULL,1,16,'2026-08-11 12:55:29.292','2026-08-11 12:55:29.292',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('e8d6bb78-1766-44fb-b579-a9fbc35bffe3','a7c7c0df-60c6-4a73-88d0-92b2fa521655','a00e2716-5d00-44d8-9161-5b5bf0d0f410','b124086d-33e9-494f-8794-58f4a6e03072','COURSE_PUBLIC_HEALTH_NYU','Public Health','Masters','Health',NULL,NULL,NULL,NULL,NULL,NULL,1,20,'2026-08-11 12:55:29.310','2026-08-11 12:55:29.310',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('f1f376c7-3422-43aa-aa26-876776b64ea3','a7c7c0df-60c6-4a73-88d0-92b2fa521655','2167f164-92a8-46c6-b384-140cf81475cc','2b197c8e-c7f1-4215-92c1-2fd89b21d4ae','COURSE_NURSING_MONASH','Nursing','Bachelors','Health',NULL,NULL,NULL,NULL,NULL,NULL,1,15,'2026-08-11 12:55:29.287','2026-08-11 12:55:29.287',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('fa3f3625-c64e-488a-955f-7cb6f94123fb','a7c7c0df-60c6-4a73-88d0-92b2fa521655','62ca23c4-f78f-4685-8cbe-b04d1039d72b','4b35383b-2fc4-40bc-8592-e19b9cf04222','COURSE_BBA_YORK','BBA','Bachelors','Business',NULL,NULL,NULL,NULL,NULL,NULL,1,6,'2026-08-11 12:55:29.250','2026-08-11 12:55:29.250',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf');
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `currencies`
--

DROP TABLE IF EXISTS `currencies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `currencies` (
  `id` varchar(191) NOT NULL,
  `companyId` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `symbol` varchar(191) DEFAULT NULL,
  `decimalPlaces` int(11) NOT NULL DEFAULT 2,
  `description` text DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `currencies_companyId_code_key` (`companyId`,`code`),
  KEY `currencies_companyId_idx` (`companyId`),
  KEY `currencies_isActive_idx` (`isActive`),
  CONSTRAINT `currencies_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `currencies`
--

LOCK TABLES `currencies` WRITE;
/*!40000 ALTER TABLE `currencies` DISABLE KEYS */;
INSERT INTO `currencies` VALUES ('241e640d-03be-4d94-aea3-0e1b1defdacb','a7c7c0df-60c6-4a73-88d0-92b2fa521655','SGD','Singapore Dollar','S$',2,NULL,1,9,'2026-08-11 12:55:28.691','2026-08-11 12:55:28.691',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('3cf75d86-cd36-44e9-924a-c76a0d9618a2','a7c7c0df-60c6-4a73-88d0-92b2fa521655','AUD','Australian Dollar','A$',2,NULL,1,5,'2026-08-11 12:55:28.670','2026-08-11 12:55:28.670',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('3dc3c0f3-500f-4858-8cdd-9eeb9b5e0786','a7c7c0df-60c6-4a73-88d0-92b2fa521655','GBP','British Pound','£',2,NULL,1,3,'2026-08-11 12:55:28.661','2026-08-11 12:55:28.661',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('56cc6b92-402f-43da-a70d-54e8fb988ea4','a7c7c0df-60c6-4a73-88d0-92b2fa521655','INR','Indian Rupee','₹',2,NULL,1,1,'2026-08-11 12:55:28.648','2026-08-11 12:55:28.648',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('a4b0c5e2-6267-4fe8-a38a-9aa7b0740ca9','a7c7c0df-60c6-4a73-88d0-92b2fa521655','USD','US Dollar','$',2,NULL,1,2,'2026-08-11 12:55:28.654','2026-08-11 12:55:28.654',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('a7dd1923-ca21-4707-bb63-03d83ce9047f','a7c7c0df-60c6-4a73-88d0-92b2fa521655','EUR','Euro','€',2,NULL,1,7,'2026-08-11 12:55:28.679','2026-08-11 12:55:28.679',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('c6aa7284-15d7-4b0b-a672-dc9799846cd8','a7c7c0df-60c6-4a73-88d0-92b2fa521655','CAD','Canadian Dollar','C$',2,NULL,1,4,'2026-08-11 12:55:28.666','2026-08-11 12:55:28.666',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('ca3934f9-4cb9-4606-8498-6b28f6bbe000','a7c7c0df-60c6-4a73-88d0-92b2fa521655','AED','UAE Dirham','د.إ',2,NULL,1,8,'2026-08-11 12:55:28.685','2026-08-11 12:55:28.685',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('e445f835-df5a-4b58-9474-16e77ff5e1d4','a7c7c0df-60c6-4a73-88d0-92b2fa521655','NZD','New Zealand Dollar','NZ$',2,NULL,1,6,'2026-08-11 12:55:28.675','2026-08-11 12:55:28.675',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf');
/*!40000 ALTER TABLE `currencies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `departments` (
  `id` varchar(191) NOT NULL,
  `companyId` varchar(191) NOT NULL,
  `branchId` varchar(191) DEFAULT NULL,
  `code` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `departments_companyId_code_key` (`companyId`,`code`),
  KEY `departments_companyId_idx` (`companyId`),
  KEY `departments_branchId_idx` (`branchId`),
  KEY `departments_isActive_idx` (`isActive`),
  CONSTRAINT `departments_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `departments_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES ('16d7008e-5b53-4006-a6a6-548fea70f6a9','a7c7c0df-60c6-4a73-88d0-92b2fa521655','caabc1ee-3ff0-496c-802a-746bbbbae703','MARKETING','Marketing',NULL,1,6,'2026-08-11 12:55:28.544','2026-08-11 12:55:28.544',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('1b169c91-8f38-4171-b0cc-45efa6788705','a7c7c0df-60c6-4a73-88d0-92b2fa521655','caabc1ee-3ff0-496c-802a-746bbbbae703','OPERATIONS','Operations',NULL,1,7,'2026-08-11 12:55:28.548','2026-08-11 12:55:28.548',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('4238d453-d1c3-4160-a9f8-61d1309a996e','a7c7c0df-60c6-4a73-88d0-92b2fa521655','caabc1ee-3ff0-496c-802a-746bbbbae703','RECEPTION','Reception',NULL,1,5,'2026-08-11 12:55:28.539','2026-08-11 12:55:28.539',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('6134232b-582d-4566-a643-645179561a77','a7c7c0df-60c6-4a73-88d0-92b2fa521655','caabc1ee-3ff0-496c-802a-746bbbbae703','STUDENT_SUPPORT','Student Support',NULL,1,8,'2026-08-11 12:55:28.552','2026-08-11 12:55:28.552',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('959aeffe-b083-491f-8c17-99a0990a5de5','a7c7c0df-60c6-4a73-88d0-92b2fa521655','caabc1ee-3ff0-496c-802a-746bbbbae703','ADMISSIONS','Admissions',NULL,1,2,'2026-08-11 12:55:28.523','2026-08-11 12:55:28.523',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('96d80165-0b20-4992-a8c0-9cd00acef743','a7c7c0df-60c6-4a73-88d0-92b2fa521655','caabc1ee-3ff0-496c-802a-746bbbbae703','COUNSELLING','Counselling',NULL,1,1,'2026-08-11 12:55:28.516','2026-08-11 12:55:28.516',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('d5505c7b-8ad4-49b8-b666-af83f29a2055','a7c7c0df-60c6-4a73-88d0-92b2fa521655','caabc1ee-3ff0-496c-802a-746bbbbae703','VISA','Visa',NULL,1,3,'2026-08-11 12:55:28.528','2026-08-11 12:55:28.528',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('e08875e8-3aea-431a-84eb-96be9aa8e309','a7c7c0df-60c6-4a73-88d0-92b2fa521655','caabc1ee-3ff0-496c-802a-746bbbbae703','ACCOUNTS','Accounts',NULL,1,4,'2026-08-11 12:55:28.534','2026-08-11 12:55:28.534',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_requirements`
--

DROP TABLE IF EXISTS `document_requirements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `document_requirements` (
  `id` varchar(191) NOT NULL,
  `companyId` varchar(191) NOT NULL,
  `documentTypeId` varchar(191) NOT NULL,
  `countryId` varchar(191) DEFAULT NULL,
  `visaTypeId` varchar(191) DEFAULT NULL,
  `code` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `applicableFor` varchar(191) DEFAULT NULL,
  `isMandatory` tinyint(1) NOT NULL DEFAULT 1,
  `description` text DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `document_requirements_companyId_code_key` (`companyId`,`code`),
  KEY `document_requirements_companyId_idx` (`companyId`),
  KEY `document_requirements_documentTypeId_idx` (`documentTypeId`),
  KEY `document_requirements_countryId_idx` (`countryId`),
  KEY `document_requirements_visaTypeId_idx` (`visaTypeId`),
  KEY `document_requirements_isActive_idx` (`isActive`),
  CONSTRAINT `document_requirements_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `document_requirements_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `countries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `document_requirements_documentTypeId_fkey` FOREIGN KEY (`documentTypeId`) REFERENCES `document_types` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `document_requirements_visaTypeId_fkey` FOREIGN KEY (`visaTypeId`) REFERENCES `visa_types` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_requirements`
--

LOCK TABLES `document_requirements` WRITE;
/*!40000 ALTER TABLE `document_requirements` DISABLE KEYS */;
INSERT INTO `document_requirements` VALUES ('06d4f036-413c-46ad-8960-8ba4faa66c4b','a7c7c0df-60c6-4a73-88d0-92b2fa521655','9450b155-2101-44ec-a921-7a8825180454','4b35383b-2fc4-40bc-8592-e19b9cf04222','897abf45-14a4-43ea-84e4-e303b692b6fb','REQ_IELTS_CA_STUDY','IELTS for Canada Study Permit','STUDENT',1,NULL,1,2,'2026-08-11 12:55:29.539','2026-08-11 12:55:29.539',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('27c34331-5003-42d5-8494-83f856c80315','a7c7c0df-60c6-4a73-88d0-92b2fa521655','d0e6e213-622d-4b9c-8c07-8b0aa82b911d',NULL,NULL,'REQ_LOR_GENERAL','LOR (general application)','APPLICATION',0,NULL,1,9,'2026-08-11 12:55:29.567','2026-08-11 12:55:29.567',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('2cb30218-ce10-4bd5-ae95-e76b73517001','a7c7c0df-60c6-4a73-88d0-92b2fa521655','d0b1cd0d-6d35-4d16-962e-c1fdc90f6838','2b197c8e-c7f1-4215-92c1-2fd89b21d4ae','fc39cdce-b7bd-4869-8059-68bb4f1800f3','REQ_PCC_AU','PCC for Australia Student Visa','STUDENT',1,NULL,1,10,'2026-08-11 12:55:29.570','2026-08-11 12:55:29.570',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('4833eb5b-441f-4d32-ba83-da677f1b57bf','a7c7c0df-60c6-4a73-88d0-92b2fa521655','8631fbe7-0cdb-4399-8335-60e0c700e4e8','62a01f5f-05df-43f3-a430-8539fad67e22','ce6debb0-3990-468b-9bc9-3fa87dbd7a1c','REQ_CAS_UK_STUDENT','CAS for UK Student Visa','STUDENT',1,NULL,1,5,'2026-08-11 12:55:29.551','2026-08-11 12:55:29.551',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('747caebf-70eb-471b-98b8-7f93aafa136d','a7c7c0df-60c6-4a73-88d0-92b2fa521655','9fc7d6ee-7244-4dd2-b15f-77e08a4471b1',NULL,NULL,'REQ_SOP_GENERAL','SOP (general application)','APPLICATION',1,NULL,1,8,'2026-08-11 12:55:29.563','2026-08-11 12:55:29.563',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('76cd981a-8bcc-404c-b97e-7d4bc6d88fd5','a7c7c0df-60c6-4a73-88d0-92b2fa521655','25905879-cdee-492b-b072-9c9c45bcf628','4b35383b-2fc4-40bc-8592-e19b9cf04222','897abf45-14a4-43ea-84e4-e303b692b6fb','REQ_PASSPORT_CA_STUDY','Passport for Canada Study Permit','STUDENT',1,NULL,1,1,'2026-08-11 12:55:29.533','2026-08-11 12:55:29.533',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('797d09ea-eff8-4090-adb4-a448ef8ba22f','a7c7c0df-60c6-4a73-88d0-92b2fa521655','25905879-cdee-492b-b072-9c9c45bcf628','b124086d-33e9-494f-8794-58f4a6e03072','4d01c4a2-3116-4511-a052-c85556dae77c','REQ_PASSPORT_US_F1','Passport for F-1 Visa','STUDENT',1,NULL,1,6,'2026-08-11 12:55:29.556','2026-08-11 12:55:29.556',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('951f151b-b953-4213-8ced-48b3ca7f53b0','a7c7c0df-60c6-4a73-88d0-92b2fa521655','8631fbe7-0cdb-4399-8335-60e0c700e4e8','b124086d-33e9-494f-8794-58f4a6e03072','4d01c4a2-3116-4511-a052-c85556dae77c','REQ_I20_US_F1','I-20 for F-1 Visa','STUDENT',1,NULL,1,7,'2026-08-11 12:55:29.560','2026-08-11 12:55:29.560',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('9f59c3f8-2597-48e7-ae3d-db42c23dc433','a7c7c0df-60c6-4a73-88d0-92b2fa521655','25905879-cdee-492b-b072-9c9c45bcf628','62a01f5f-05df-43f3-a430-8539fad67e22','ce6debb0-3990-468b-9bc9-3fa87dbd7a1c','REQ_PASSPORT_UK_STUDENT','Passport for UK Student Visa','STUDENT',1,NULL,1,4,'2026-08-11 12:55:29.547','2026-08-11 12:55:29.547',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('e73cea71-9d79-42db-af69-aeb8c97083a9','a7c7c0df-60c6-4a73-88d0-92b2fa521655','93b7278b-5169-4e4b-919c-b7de14467198','4b35383b-2fc4-40bc-8592-e19b9cf04222','897abf45-14a4-43ea-84e4-e303b692b6fb','REQ_BANK_CA_STUDY','Bank Statement for Canada Study Permit','STUDENT',1,NULL,1,3,'2026-08-11 12:55:29.544','2026-08-11 12:55:29.544',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf');
/*!40000 ALTER TABLE `document_requirements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_types`
--

DROP TABLE IF EXISTS `document_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `document_types` (
  `id` varchar(191) NOT NULL,
  `companyId` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `category` varchar(191) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `document_types_companyId_code_key` (`companyId`,`code`),
  KEY `document_types_companyId_idx` (`companyId`),
  KEY `document_types_category_idx` (`category`),
  KEY `document_types_isActive_idx` (`isActive`),
  CONSTRAINT `document_types_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_types`
--

LOCK TABLES `document_types` WRITE;
/*!40000 ALTER TABLE `document_types` DISABLE KEYS */;
INSERT INTO `document_types` VALUES ('045a16a9-c284-4267-a21e-c000ae582469','a7c7c0df-60c6-4a73-88d0-92b2fa521655','MARKSHEET_12','12th Marksheet','Academic',NULL,1,4,'2026-08-11 12:55:29.056','2026-08-11 12:55:29.056',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('060ab902-bb20-4daf-9170-1ad69ceb7668','a7c7c0df-60c6-4a73-88d0-92b2fa521655','TRANSCRIPT','Transcript','Academic',NULL,1,7,'2026-08-11 12:55:29.066','2026-08-11 12:55:29.066',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('25905879-cdee-492b-b072-9c9c45bcf628','a7c7c0df-60c6-4a73-88d0-92b2fa521655','PASSPORT','Passport','Identity',NULL,1,1,'2026-08-11 12:55:29.040','2026-08-11 12:55:29.040',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('46e80f8e-b12a-4418-9768-f758eebdc3ae','a7c7c0df-60c6-4a73-88d0-92b2fa521655','MARKSHEET_10','10th Marksheet','Academic',NULL,1,3,'2026-08-11 12:55:29.051','2026-08-11 12:55:29.051',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('52fc8459-8ac9-4224-8b93-569a89f3d905','a7c7c0df-60c6-4a73-88d0-92b2fa521655','MEDICAL','Medical Certificate','Visa',NULL,1,17,'2026-08-11 12:55:29.105','2026-08-11 12:55:29.105',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('629312ed-8c03-401f-a0b1-94e1b3966626','a7c7c0df-60c6-4a73-88d0-92b2fa521655','PASSPORT_PHOTO','Passport Photograph','Identity',NULL,1,2,'2026-08-11 12:55:29.045','2026-08-11 12:55:29.045',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('65e38987-f1a7-4968-bab3-090a2f47bd7b','a7c7c0df-60c6-4a73-88d0-92b2fa521655','CV','CV / Resume','Application',NULL,1,12,'2026-08-11 12:55:29.085','2026-08-11 12:55:29.085',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('8631fbe7-0cdb-4399-8335-60e0c700e4e8','a7c7c0df-60c6-4a73-88d0-92b2fa521655','CAS_I20','CAS / I-20','Admission',NULL,1,16,'2026-08-11 12:55:29.100','2026-08-11 12:55:29.100',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('93b7278b-5169-4e4b-919c-b7de14467198','a7c7c0df-60c6-4a73-88d0-92b2fa521655','BANK_STATEMENT','Bank Statement','Finance',NULL,1,13,'2026-08-11 12:55:29.091','2026-08-11 12:55:29.091',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('9450b155-2101-44ec-a921-7a8825180454','a7c7c0df-60c6-4a73-88d0-92b2fa521655','IELTS','IELTS','Language',NULL,1,8,'2026-08-11 12:55:29.069','2026-08-11 12:55:29.069',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('9fc7d6ee-7244-4dd2-b15f-77e08a4471b1','a7c7c0df-60c6-4a73-88d0-92b2fa521655','SOP','SOP','Application',NULL,1,10,'2026-08-11 12:55:29.078','2026-08-11 12:55:29.078',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('b6f97e66-70a3-4ba1-a95c-34bf38d2b6b5','a7c7c0df-60c6-4a73-88d0-92b2fa521655','OFFER_LETTER','Offer Letter','Admission',NULL,1,15,'2026-08-11 12:55:29.097','2026-08-11 12:55:29.097',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('d0b1cd0d-6d35-4d16-962e-c1fdc90f6838','a7c7c0df-60c6-4a73-88d0-92b2fa521655','PCC','PCC','Visa',NULL,1,18,'2026-08-11 12:55:29.109','2026-08-11 12:55:29.109',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('d0e6e213-622d-4b9c-8c07-8b0aa82b911d','a7c7c0df-60c6-4a73-88d0-92b2fa521655','LOR','LOR','Application',NULL,1,11,'2026-08-11 12:55:29.082','2026-08-11 12:55:29.082',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('d5172c09-843c-42e0-9f7e-13f973ec7bed','a7c7c0df-60c6-4a73-88d0-92b2fa521655','BACHELOR_DEGREE','Bachelor Degree','Academic',NULL,1,5,'2026-08-11 12:55:29.060','2026-08-11 12:55:29.060',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('e514b957-bdfc-475d-b9d6-9efd81cdc892','a7c7c0df-60c6-4a73-88d0-92b2fa521655','BANK_CERTIFICATE','Bank Certificate','Finance',NULL,1,14,'2026-08-11 12:55:29.094','2026-08-11 12:55:29.094',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('e77f91b8-e966-4147-9a15-2dc4a0b62292','a7c7c0df-60c6-4a73-88d0-92b2fa521655','PTE','PTE','Language',NULL,1,9,'2026-08-11 12:55:29.074','2026-08-11 12:55:29.074',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('fc24e1bc-1297-470f-b37a-1f3faac325b0','a7c7c0df-60c6-4a73-88d0-92b2fa521655','AFFIDAVIT','Affidavit of Support','Finance',NULL,1,19,'2026-08-11 12:55:29.113','2026-08-11 12:55:29.113',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('fd5a27e8-6ec9-487e-b88b-ec3cb53051f7','a7c7c0df-60c6-4a73-88d0-92b2fa521655','MASTER_DEGREE','Master Degree','Academic',NULL,1,6,'2026-08-11 12:55:29.063','2026-08-11 12:55:29.063',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf');
/*!40000 ALTER TABLE `document_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `documents` (
  `id` varchar(191) NOT NULL,
  `studentId` varchar(191) DEFAULT NULL,
  `entityType` varchar(191) DEFAULT NULL,
  `entityId` varchar(191) DEFAULT NULL,
  `name` varchar(191) NOT NULL,
  `fileName` varchar(191) NOT NULL,
  `filePath` varchar(191) NOT NULL,
  `fileSize` int(11) NOT NULL,
  `mimeType` varchar(191) NOT NULL,
  `category` varchar(191) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `documents_studentId_idx` (`studentId`),
  KEY `documents_entityType_entityId_idx` (`entityType`,`entityId`),
  CONSTRAINT `documents_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `embassies`
--

DROP TABLE IF EXISTS `embassies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `embassies` (
  `id` varchar(191) NOT NULL,
  `companyId` varchar(191) NOT NULL,
  `countryId` varchar(191) DEFAULT NULL,
  `code` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `city` varchar(191) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `website` varchar(191) DEFAULT NULL,
  `jurisdiction` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `embassies_companyId_code_key` (`companyId`,`code`),
  KEY `embassies_companyId_idx` (`companyId`),
  KEY `embassies_countryId_idx` (`countryId`),
  KEY `embassies_isActive_idx` (`isActive`),
  CONSTRAINT `embassies_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `embassies_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `countries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `embassies`
--

LOCK TABLES `embassies` WRITE;
/*!40000 ALTER TABLE `embassies` DISABLE KEYS */;
INSERT INTO `embassies` VALUES ('1e2d83a8-d74b-4e3b-82ce-335d1cee5aec','a7c7c0df-60c6-4a73-88d0-92b2fa521655','dd34bffe-780f-44f8-9335-4316700b0b26','EMB_NZ_MUMBAI','New Zealand Consulate – Mumbai','Mumbai',NULL,NULL,NULL,NULL,NULL,NULL,1,6,'2026-08-11 12:55:29.462','2026-08-11 12:55:29.462',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('356823e6-04d9-4a7e-bb27-93414edb9400','a7c7c0df-60c6-4a73-88d0-92b2fa521655','10ed19e8-91f6-4c4d-bba9-603ece0ae33e','EMB_SG_DELHI','Singapore High Commission – New Delhi','New Delhi',NULL,NULL,NULL,NULL,NULL,NULL,1,9,'2026-08-11 12:55:29.526','2026-08-11 12:55:29.526',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('4343204b-cb4d-4a91-9d56-c3c8b0fca002','a7c7c0df-60c6-4a73-88d0-92b2fa521655','6062255c-4a0c-41b9-ba12-35111e6325fe','EMB_IE_DELHI','Irish Embassy – New Delhi','New Delhi',NULL,NULL,NULL,NULL,NULL,NULL,1,7,'2026-08-11 12:55:29.490','2026-08-11 12:55:29.490',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('6c7feb2b-8c6c-4b2b-baa2-355452011896','a7c7c0df-60c6-4a73-88d0-92b2fa521655','2b197c8e-c7f1-4215-92c1-2fd89b21d4ae','EMB_AU_DELHI','Australian High Commission – New Delhi','New Delhi',NULL,NULL,NULL,NULL,NULL,NULL,1,3,'2026-08-11 12:55:29.449','2026-08-11 12:55:29.449',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('b2363899-949d-4587-9d02-4164a1ff98aa','a7c7c0df-60c6-4a73-88d0-92b2fa521655','62a01f5f-05df-43f3-a430-8539fad67e22','EMB_GB_DELHI','British High Commission – New Delhi','New Delhi',NULL,NULL,NULL,NULL,NULL,NULL,1,2,'2026-08-11 12:55:29.443','2026-08-11 12:55:29.443',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('bab08eb6-8d96-452d-8fd9-dcfa7449f429','a7c7c0df-60c6-4a73-88d0-92b2fa521655','4b35383b-2fc4-40bc-8592-e19b9cf04222','EMB_CA_DELHI','Canadian High Commission – New Delhi','New Delhi',NULL,NULL,NULL,NULL,NULL,NULL,1,1,'2026-08-11 12:55:29.436','2026-08-11 12:55:29.436',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('bf49b073-f79b-49bd-88e4-582df33dc4f6','a7c7c0df-60c6-4a73-88d0-92b2fa521655','cfffb8e3-22dd-4cf2-a842-f2093f32973e','EMB_FR_DELHI','French Embassy – New Delhi','New Delhi',NULL,NULL,NULL,NULL,NULL,NULL,1,8,'2026-08-11 12:55:29.512','2026-08-11 12:55:29.512',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('c2b733fe-147c-4441-a216-c0a35976de7e','a7c7c0df-60c6-4a73-88d0-92b2fa521655','b124086d-33e9-494f-8794-58f4a6e03072','EMB_US_MUMBAI','US Consulate – Mumbai','Mumbai',NULL,NULL,NULL,NULL,NULL,NULL,1,4,'2026-08-11 12:55:29.453','2026-08-11 12:55:29.453',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('f7e7b229-4367-46fa-9811-c9e092e378d8','a7c7c0df-60c6-4a73-88d0-92b2fa521655','863cd63d-2281-4b42-80c8-9fa3ac3e2e89','EMB_DE_MUMBAI','German Consulate – Mumbai','Mumbai',NULL,NULL,NULL,NULL,NULL,NULL,1,5,'2026-08-11 12:55:29.458','2026-08-11 12:55:29.458',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf');
/*!40000 ALTER TABLE `embassies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enquiries`
--

DROP TABLE IF EXISTS `enquiries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `enquiries` (
  `id` varchar(191) NOT NULL,
  `enquiryCode` varchar(191) NOT NULL,
  `branchId` varchar(191) NOT NULL,
  `assignedToId` varchar(191) DEFAULT NULL,
  `assignedById` varchar(191) DEFAULT NULL,
  `firstName` varchar(191) NOT NULL,
  `lastName` varchar(191) DEFAULT NULL,
  `email` varchar(191) NOT NULL,
  `mobile` varchar(191) NOT NULL,
  `mobileCountry` varchar(191) DEFAULT '+91',
  `alternateNo` varchar(191) DEFAULT NULL,
  `passportNo` varchar(191) DEFAULT NULL,
  `dateOfBirth` datetime(3) DEFAULT NULL,
  `gender` varchar(191) DEFAULT NULL,
  `nationality` varchar(191) DEFAULT NULL,
  `maritalStatus` varchar(191) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `highestQual` varchar(191) DEFAULT NULL,
  `interestedCourse` varchar(191) DEFAULT NULL,
  `testsGiven` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`testsGiven`)),
  `interestedCountry` varchar(191) DEFAULT NULL,
  `intake` varchar(191) DEFAULT NULL,
  `applyLevel` varchar(191) DEFAULT NULL,
  `source` varchar(191) DEFAULT NULL,
  `otherReference` varchar(191) DEFAULT NULL,
  `status` enum('NEW','CONTACTED','INTERESTED','HIGHLY_INTERESTED','FOLLOW_UP','APPOINTMENT','DEMO_SCHEDULED','DEMO_ATTENDED','COUNSELLING','DOCUMENTS_PENDING','APPLICATION_STARTED','CONVERTED','HOLD','LOST','NOT_INTERESTED','SPAM','DUPLICATE') NOT NULL DEFAULT 'NEW',
  `priority` enum('URGENT','HIGH','MEDIUM','LOW') NOT NULL DEFAULT 'MEDIUM',
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`tags`)),
  `remark` text DEFAULT NULL,
  `lastRemark` text DEFAULT NULL,
  `dropReason` text DEFAULT NULL,
  `droppedAt` datetime(3) DEFAULT NULL,
  `convertedAt` datetime(3) DEFAULT NULL,
  `lastTouchedAt` datetime(3) DEFAULT NULL,
  `studentId` varchar(191) DEFAULT NULL,
  `leadId` varchar(191) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `enquiries_enquiryCode_key` (`enquiryCode`),
  UNIQUE KEY `enquiries_studentId_key` (`studentId`),
  UNIQUE KEY `enquiries_leadId_key` (`leadId`),
  KEY `enquiries_branchId_idx` (`branchId`),
  KEY `enquiries_assignedToId_idx` (`assignedToId`),
  KEY `enquiries_status_idx` (`status`),
  KEY `enquiries_priority_idx` (`priority`),
  KEY `enquiries_email_idx` (`email`),
  KEY `enquiries_mobile_idx` (`mobile`),
  KEY `enquiries_passportNo_idx` (`passportNo`),
  KEY `enquiries_studentId_idx` (`studentId`),
  KEY `enquiries_leadId_idx` (`leadId`),
  KEY `enquiries_createdAt_idx` (`createdAt`),
  KEY `enquiries_lastTouchedAt_idx` (`lastTouchedAt`),
  KEY `enquiries_assignedById_fkey` (`assignedById`),
  CONSTRAINT `enquiries_assignedById_fkey` FOREIGN KEY (`assignedById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `enquiries_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `enquiries_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `enquiries_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `leads` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `enquiries_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enquiries`
--

LOCK TABLES `enquiries` WRITE;
/*!40000 ALTER TABLE `enquiries` DISABLE KEYS */;
INSERT INTO `enquiries` VALUES ('262f50e2-74a4-4475-8571-f55d77a9b8d8','MAIN-ENQ000001','caabc1ee-3ff0-496c-802a-746bbbbae703','f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf','Darshil','Kachhadiya','kachhadiyadarshil2@gmail.com','8799338055','+91','12333367',NULL,'2005-12-02 00:00:00.000','Male','India','Single','A/120,Tirupati society near balagi bungalows, savaliya circle, yogi chowk , surat.','','MBA','[]','Canada','Jul-2026','','Walk-in','12222','INTERESTED','MEDIUM','[\"IELTS\",\"CANADA\",\"AUSTRALIA\",\"VIP\",\"SCHOLARSHIP\"]','new student\nVisit purpose: Study Abroad Enquiry','new student\nVisit purpose: Study Abroad Enquiry',NULL,NULL,NULL,'2026-08-11 12:23:37.196',NULL,'5a663213-88f8-4414-aa01-04ffe6779a75','{\"smartReminder\":{\"anchorKey\":\"created\",\"daysWithoutFollowUp\":38,\"lastTriggeredAt\":\"2026-08-11T12:23:37.196Z\",\"completedAt\":\"2026-08-11T12:23:37.196Z\",\"steps\":{\"reminder\":{\"done\":true,\"at\":\"2026-08-11T12:23:37.196Z\",\"followupId\":\"4666cd1a-d5f1-462b-ab81-d2370cb10f42\"},\"notification\":{\"done\":true,\"at\":\"2026-08-11T12:23:37.196Z\",\"notificationId\":\"357e6d82-a806-4b30-aac1-2befc955694c\"},\"email\":{\"done\":true,\"at\":\"2026-08-11T12:23:37.196Z\",\"communicationId\":\"e3cbb454-8c0b-4db9-a6d4-6091924c49f2\"}}}}','2026-07-04 07:32:08.473','2026-08-11 12:23:37.292',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('cf4ba80b-9f14-4321-aa4d-3c7c626ca345','MAIN-ENQ000002','caabc1ee-3ff0-496c-802a-746bbbbae703','f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf','Rahul','Patel','rahul.patel@test.com','1234567890','+91','',NULL,NULL,'','','','','','','[]','','','','Walk-in','','DEMO_SCHEDULED','MEDIUM','[\"PTE\"]','123\nVisit purpose: Study Abroad Enquiry','123\nVisit purpose: Study Abroad Enquiry',NULL,NULL,NULL,'2026-08-12 06:02:03.621',NULL,'41c1ec0d-ff02-4741-9aa8-8acea690e181','{\"smartReminder\":{\"anchorKey\":\"created\",\"daysWithoutFollowUp\":36,\"lastTriggeredAt\":\"2026-08-12T06:02:03.621Z\",\"completedAt\":\"2026-08-12T06:02:03.621Z\",\"steps\":{\"reminder\":{\"done\":true,\"at\":\"2026-08-12T06:02:03.621Z\",\"followupId\":\"5c3d4611-327e-4f19-a298-10c3f47e4478\"},\"notification\":{\"done\":true,\"at\":\"2026-08-12T06:02:03.621Z\",\"notificationId\":\"b3a57e1e-ed25-419f-8f48-f3704e282096\"},\"email\":{\"done\":true,\"at\":\"2026-08-12T06:02:03.621Z\",\"communicationId\":\"3455f558-01a1-4953-a74b-9d5787770fb2\"}}}}','2026-07-06 07:45:07.595','2026-08-12 06:02:03.666',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf');
/*!40000 ALTER TABLE `enquiries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enquiry_appointments`
--

DROP TABLE IF EXISTS `enquiry_appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `enquiry_appointments` (
  `id` varchar(191) NOT NULL,
  `enquiryId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `counsellorId` varchar(191) DEFAULT NULL,
  `title` varchar(191) DEFAULT NULL,
  `remark` text DEFAULT NULL,
  `room` varchar(191) DEFAULT NULL,
  `mode` enum('ONLINE','OFFLINE') NOT NULL DEFAULT 'OFFLINE',
  `platform` enum('GOOGLE_MEET','ZOOM') DEFAULT NULL,
  `meetingLink` varchar(191) DEFAULT NULL,
  `startAt` datetime(3) NOT NULL,
  `endAt` datetime(3) DEFAULT NULL,
  `isCompleted` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `enquiry_appointments_enquiryId_idx` (`enquiryId`),
  KEY `enquiry_appointments_counsellorId_idx` (`counsellorId`),
  KEY `enquiry_appointments_userId_fkey` (`userId`),
  CONSTRAINT `enquiry_appointments_counsellorId_fkey` FOREIGN KEY (`counsellorId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `enquiry_appointments_enquiryId_fkey` FOREIGN KEY (`enquiryId`) REFERENCES `enquiries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `enquiry_appointments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enquiry_appointments`
--

LOCK TABLES `enquiry_appointments` WRITE;
/*!40000 ALTER TABLE `enquiry_appointments` DISABLE KEYS */;
INSERT INTO `enquiry_appointments` VALUES ('9dd376ab-b500-47e8-a58a-a054c564db89','cf4ba80b-9f14-4321-aa4d-3c7c626ca345','f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf','In-person Counselling','csdcwscf','Room A','OFFLINE',NULL,NULL,'2026-07-07 04:30:00.000',NULL,0,'2026-07-06 07:47:14.771');
/*!40000 ALTER TABLE `enquiry_appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enquiry_audit_logs`
--

DROP TABLE IF EXISTS `enquiry_audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `enquiry_audit_logs` (
  `id` varchar(191) NOT NULL,
  `enquiryId` varchar(191) NOT NULL,
  `userId` varchar(191) DEFAULT NULL,
  `action` varchar(191) NOT NULL,
  `field` varchar(191) DEFAULT NULL,
  `oldValue` text DEFAULT NULL,
  `newValue` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `ipAddress` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `enquiry_audit_logs_enquiryId_idx` (`enquiryId`),
  KEY `enquiry_audit_logs_createdAt_idx` (`createdAt`),
  KEY `enquiry_audit_logs_userId_fkey` (`userId`),
  CONSTRAINT `enquiry_audit_logs_enquiryId_fkey` FOREIGN KEY (`enquiryId`) REFERENCES `enquiries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `enquiry_audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enquiry_audit_logs`
--

LOCK TABLES `enquiry_audit_logs` WRITE;
/*!40000 ALTER TABLE `enquiry_audit_logs` DISABLE KEYS */;
INSERT INTO `enquiry_audit_logs` VALUES ('07da5acb-185d-480c-9361-dd36c485398e','cf4ba80b-9f14-4321-aa4d-3c7c626ca345','f16e56db-fd62-4993-a487-7fb5906e5caf','UPDATE','tags','[]','[\"PTE\"]',NULL,'::1','2026-08-12 06:01:22.708'),('0cf8b2bb-a7f4-4ac5-9049-169f847dcf06','262f50e2-74a4-4475-8571-f55d77a9b8d8','f16e56db-fd62-4993-a487-7fb5906e5caf','UPDATE','interestedCourse','','MBA',NULL,'::1','2026-07-06 06:33:34.972'),('0de205f4-fd28-44c8-a0a3-27f6c4103616','262f50e2-74a4-4475-8571-f55d77a9b8d8','f16e56db-fd62-4993-a487-7fb5906e5caf','COMMUNICATION',NULL,NULL,'WHATSAPP','Hi Darshil Kachhadiya,','::1','2026-07-06 06:36:49.497'),('1b7d00f8-83a4-41a3-8411-af56cb07f669','262f50e2-74a4-4475-8571-f55d77a9b8d8','f16e56db-fd62-4993-a487-7fb5906e5caf','FOLLOWUP','smartReminder',NULL,'TRIGGERED','Smart reminder cascade after 38 days without follow-up',NULL,'2026-08-11 12:23:37.307'),('1dff4f93-f4d2-462b-9218-073ff189beb0','cf4ba80b-9f14-4321-aa4d-3c7c626ca345','f16e56db-fd62-4993-a487-7fb5906e5caf','DEMO',NULL,NULL,NULL,'IELTS Foundation · Morning A · POSITIVE','::1','2026-07-06 08:12:31.922'),('1e1669c2-16e5-4d8a-bcab-7fb56ebbf34e','262f50e2-74a4-4475-8571-f55d77a9b8d8','f16e56db-fd62-4993-a487-7fb5906e5caf','UPDATE','interestedCourse','','',NULL,'::1','2026-07-06 06:05:41.832'),('1f176ea9-9c38-4362-8426-273fabc61bb1','262f50e2-74a4-4475-8571-f55d77a9b8d8','f16e56db-fd62-4993-a487-7fb5906e5caf','COMMUNICATION',NULL,NULL,'CALL','Quick call to Darshil Kachhadiya','::1','2026-07-06 06:36:49.047'),('33b85968-299c-4908-94f0-549045ea0ffb','cf4ba80b-9f14-4321-aa4d-3c7c626ca345','f16e56db-fd62-4993-a487-7fb5906e5caf','CREATE',NULL,NULL,'MAIN-ENQ000002','Qualified enquiry from walk-in MAIN-LEAD-2026-000002','::1','2026-07-06 07:45:07.609'),('36eeb515-35f8-467a-b5f2-c3467d4ce44b','262f50e2-74a4-4475-8571-f55d77a9b8d8','f16e56db-fd62-4993-a487-7fb5906e5caf','STATUS_CHANGE','status','NEW','INTERESTED',NULL,'::1','2026-07-06 05:25:31.562'),('4f03346b-8397-4f4c-ab87-b222d699df36','cf4ba80b-9f14-4321-aa4d-3c7c626ca345','f16e56db-fd62-4993-a487-7fb5906e5caf','FOLLOWUP','smartReminder',NULL,'TRIGGERED','Smart reminder cascade after 36 days without follow-up',NULL,'2026-08-12 06:02:03.677'),('607332b0-5aca-4776-af85-1d4d8b711272','262f50e2-74a4-4475-8571-f55d77a9b8d8','f16e56db-fd62-4993-a487-7fb5906e5caf','STATUS_CHANGE','status','NEW','CONTACTED',NULL,'::1','2026-07-06 06:31:12.523'),('7236937a-1e5b-4480-9dde-35676afce159','cf4ba80b-9f14-4321-aa4d-3c7c626ca345','f16e56db-fd62-4993-a487-7fb5906e5caf','UPDATE','interestedCountry','','',NULL,'::1','2026-07-06 08:53:17.189'),('7901163f-b207-4124-8e5d-507c573dedbf','262f50e2-74a4-4475-8571-f55d77a9b8d8','f16e56db-fd62-4993-a487-7fb5906e5caf','COMMUNICATION',NULL,NULL,'CALL','Quick call to Darshil Kachhadiya','::1','2026-07-06 06:36:47.947'),('795ee48e-a13e-49b0-9791-2bcee0255243','262f50e2-74a4-4475-8571-f55d77a9b8d8','f16e56db-fd62-4993-a487-7fb5906e5caf','CREATE',NULL,NULL,'MAIN-ENQ000001','Qualified enquiry from walk-in MAIN-LEAD-2026-000001',NULL,'2026-07-04 07:32:08.482'),('7b2987c4-5350-4a5f-9530-c06318fc8f97','262f50e2-74a4-4475-8571-f55d77a9b8d8','f16e56db-fd62-4993-a487-7fb5906e5caf','COMMUNICATION',NULL,NULL,'EMAIL','Enquiry follow-up','::1','2026-07-06 06:36:52.413'),('8cca89af-1959-4958-aa46-ed2ee12aaa6e','262f50e2-74a4-4475-8571-f55d77a9b8d8','f16e56db-fd62-4993-a487-7fb5906e5caf','COMMUNICATION',NULL,NULL,'CALL','Quick call to Darshil Kachhadiya','::1','2026-07-06 06:36:48.888'),('9e098f41-6a70-43f5-b731-3e52a3a27cba','262f50e2-74a4-4475-8571-f55d77a9b8d8','f16e56db-fd62-4993-a487-7fb5906e5caf','UPDATE','interestedCountry','','Canada',NULL,'::1','2026-07-06 06:33:34.972'),('a47415b6-1cf2-48e3-b681-2a4cb1dc5c8e','cf4ba80b-9f14-4321-aa4d-3c7c626ca345','f16e56db-fd62-4993-a487-7fb5906e5caf','APPOINTMENT',NULL,NULL,'csdcwscf','OFFLINE · Room A','::1','2026-07-06 07:47:14.788'),('b8103bfe-8b6c-4635-8a55-c22b46f8da87','262f50e2-74a4-4475-8571-f55d77a9b8d8','f16e56db-fd62-4993-a487-7fb5906e5caf','UPDATE','tags','[]','[\"IELTS\",\"CANADA\",\"AUSTRALIA\",\"VIP\",\"SCHOLARSHIP\"]',NULL,'::1','2026-07-06 06:33:34.972'),('b8e0e003-42a5-4992-b3d1-d815c5f4d409','262f50e2-74a4-4475-8571-f55d77a9b8d8','f16e56db-fd62-4993-a487-7fb5906e5caf','STATUS_CHANGE','status','CONTACTED','INTERESTED',NULL,'::1','2026-07-06 06:31:34.285'),('d94c7827-e68e-43f3-9d75-3db8e1d83a0b','262f50e2-74a4-4475-8571-f55d77a9b8d8','f16e56db-fd62-4993-a487-7fb5906e5caf','STATUS_CHANGE','status','INTERESTED','CONTACTED',NULL,'::1','2026-07-06 06:31:08.158'),('f37e956a-22ba-4b43-991d-a490ef712b04','262f50e2-74a4-4475-8571-f55d77a9b8d8','f16e56db-fd62-4993-a487-7fb5906e5caf','STATUS_CHANGE','status','CONTACTED','NEW',NULL,'::1','2026-07-06 06:31:10.638'),('fac4123d-7b08-4c9c-b87f-de4ca702fccb','cf4ba80b-9f14-4321-aa4d-3c7c626ca345','f16e56db-fd62-4993-a487-7fb5906e5caf','UPDATE','interestedCourse','','',NULL,'::1','2026-07-06 08:53:17.189'),('fbe70671-528d-4118-9369-31f13a30325c','262f50e2-74a4-4475-8571-f55d77a9b8d8','f16e56db-fd62-4993-a487-7fb5906e5caf','UPDATE','interestedCountry','','',NULL,'::1','2026-07-06 06:05:41.832');
/*!40000 ALTER TABLE `enquiry_audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enquiry_communications`
--

DROP TABLE IF EXISTS `enquiry_communications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `enquiry_communications` (
  `id` varchar(191) NOT NULL,
  `enquiryId` varchar(191) NOT NULL,
  `userId` varchar(191) DEFAULT NULL,
  `channel` enum('CALL','WHATSAPP','EMAIL','SMS','VOICE_NOTE') NOT NULL,
  `status` enum('SENT','DELIVERED','READ','FAILED') NOT NULL DEFAULT 'SENT',
  `direction` enum('INBOUND','OUTBOUND') NOT NULL DEFAULT 'OUTBOUND',
  `subject` varchar(191) DEFAULT NULL,
  `body` text DEFAULT NULL,
  `durationSec` int(11) DEFAULT NULL,
  `fileName` varchar(191) DEFAULT NULL,
  `filePath` varchar(191) DEFAULT NULL,
  `fileSize` int(11) DEFAULT NULL,
  `mimeType` varchar(191) DEFAULT NULL,
  `sentAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `createdBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `enquiry_communications_enquiryId_idx` (`enquiryId`),
  KEY `enquiry_communications_channel_idx` (`channel`),
  KEY `enquiry_communications_userId_fkey` (`userId`),
  CONSTRAINT `enquiry_communications_enquiryId_fkey` FOREIGN KEY (`enquiryId`) REFERENCES `enquiries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `enquiry_communications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enquiry_communications`
--

LOCK TABLES `enquiry_communications` WRITE;
/*!40000 ALTER TABLE `enquiry_communications` DISABLE KEYS */;
INSERT INTO `enquiry_communications` VALUES ('26bcb041-9985-41bc-b11e-7c84f7117a50','262f50e2-74a4-4475-8571-f55d77a9b8d8','f16e56db-fd62-4993-a487-7fb5906e5caf','WHATSAPP','SENT','OUTBOUND',NULL,'Hi Darshil Kachhadiya,',NULL,NULL,NULL,NULL,NULL,'2026-07-06 06:36:49.484','f16e56db-fd62-4993-a487-7fb5906e5caf'),('3455f558-01a1-4953-a74b-9d5787770fb2','cf4ba80b-9f14-4321-aa4d-3c7c626ca345','f16e56db-fd62-4993-a487-7fb5906e5caf','EMAIL','SENT','OUTBOUND','Follow-up reminder — MAIN-ENQ000002','Dear Counsellor,\n\nThis is an automatic reminder that enquiry MAIN-ENQ000002 (Rahul Patel) has had no follow-up for 36 days.\n\nPlease reach out via call, WhatsApp, or email at the earliest.\n\n— Lead Management CRM',NULL,NULL,NULL,NULL,NULL,'2026-08-12 06:02:03.660','f16e56db-fd62-4993-a487-7fb5906e5caf'),('34e7e9d7-9595-429f-885c-58334d45e582','262f50e2-74a4-4475-8571-f55d77a9b8d8','f16e56db-fd62-4993-a487-7fb5906e5caf','EMAIL','SENT','OUTBOUND',NULL,'Enquiry follow-up',NULL,NULL,NULL,NULL,NULL,'2026-07-06 06:36:52.402','f16e56db-fd62-4993-a487-7fb5906e5caf'),('4d7ef0a3-eaa5-4d51-8c38-8ba95b65dace','262f50e2-74a4-4475-8571-f55d77a9b8d8','f16e56db-fd62-4993-a487-7fb5906e5caf','CALL','SENT','OUTBOUND',NULL,'Quick call to Darshil Kachhadiya',NULL,NULL,NULL,NULL,NULL,'2026-07-06 06:36:49.038','f16e56db-fd62-4993-a487-7fb5906e5caf'),('de541ffa-d9a8-4885-a2cc-2885add82a49','262f50e2-74a4-4475-8571-f55d77a9b8d8','f16e56db-fd62-4993-a487-7fb5906e5caf','CALL','SENT','OUTBOUND',NULL,'Quick call to Darshil Kachhadiya',NULL,NULL,NULL,NULL,NULL,'2026-07-06 06:36:47.934','f16e56db-fd62-4993-a487-7fb5906e5caf'),('e3cbb454-8c0b-4db9-a6d4-6091924c49f2','262f50e2-74a4-4475-8571-f55d77a9b8d8','f16e56db-fd62-4993-a487-7fb5906e5caf','EMAIL','SENT','OUTBOUND','Follow-up reminder — MAIN-ENQ000001','Dear Counsellor,\n\nThis is an automatic reminder that enquiry MAIN-ENQ000001 (Darshil Kachhadiya) has had no follow-up for 38 days.\n\nPlease reach out via call, WhatsApp, or email at the earliest.\n\n— Lead Management CRM',NULL,NULL,NULL,NULL,NULL,'2026-08-11 12:23:37.269','f16e56db-fd62-4993-a487-7fb5906e5caf'),('f051781d-ba90-4159-a0a5-5a0474dcec36','262f50e2-74a4-4475-8571-f55d77a9b8d8','f16e56db-fd62-4993-a487-7fb5906e5caf','CALL','SENT','OUTBOUND',NULL,'Quick call to Darshil Kachhadiya',NULL,NULL,NULL,NULL,NULL,'2026-07-06 06:36:48.871','f16e56db-fd62-4993-a487-7fb5906e5caf');
/*!40000 ALTER TABLE `enquiry_communications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enquiry_demos`
--

DROP TABLE IF EXISTS `enquiry_demos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `enquiry_demos` (
  `id` varchar(191) NOT NULL,
  `enquiryId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `facultyId` varchar(191) DEFAULT NULL,
  `demoDate` datetime(3) NOT NULL,
  `class_name` varchar(191) DEFAULT NULL,
  `batch` varchar(191) DEFAULT NULL,
  `attendance` enum('PRESENT','ABSENT','LATE','PARTIAL','NOT_MARKED') NOT NULL DEFAULT 'NOT_MARKED',
  `feedback` text DEFAULT NULL,
  `result` enum('PENDING','POSITIVE','NEUTRAL','NEGATIVE','CONVERTED') NOT NULL DEFAULT 'PENDING',
  `remark` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `enquiry_demos_enquiryId_idx` (`enquiryId`),
  KEY `enquiry_demos_facultyId_idx` (`facultyId`),
  KEY `enquiry_demos_userId_fkey` (`userId`),
  CONSTRAINT `enquiry_demos_enquiryId_fkey` FOREIGN KEY (`enquiryId`) REFERENCES `enquiries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `enquiry_demos_facultyId_fkey` FOREIGN KEY (`facultyId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `enquiry_demos_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enquiry_demos`
--

LOCK TABLES `enquiry_demos` WRITE;
/*!40000 ALTER TABLE `enquiry_demos` DISABLE KEYS */;
INSERT INTO `enquiry_demos` VALUES ('f2ed8180-c086-4159-9996-18818c9966a9','cf4ba80b-9f14-4321-aa4d-3c7c626ca345','f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-07 04:30:00.000','IELTS Foundation','Morning A','NOT_MARKED',NULL,'POSITIVE',NULL,'2026-07-06 08:12:31.912','2026-07-06 08:12:31.912');
/*!40000 ALTER TABLE `enquiry_demos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enquiry_documents`
--

DROP TABLE IF EXISTS `enquiry_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `enquiry_documents` (
  `id` varchar(191) NOT NULL,
  `enquiryId` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `fileName` varchar(191) NOT NULL,
  `filePath` varchar(191) NOT NULL,
  `fileSize` int(11) NOT NULL,
  `mimeType` varchar(191) NOT NULL,
  `category` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `createdBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `enquiry_documents_enquiryId_idx` (`enquiryId`),
  CONSTRAINT `enquiry_documents_enquiryId_fkey` FOREIGN KEY (`enquiryId`) REFERENCES `enquiries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enquiry_documents`
--

LOCK TABLES `enquiry_documents` WRITE;
/*!40000 ALTER TABLE `enquiry_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `enquiry_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enquiry_followups`
--

DROP TABLE IF EXISTS `enquiry_followups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `enquiry_followups` (
  `id` varchar(191) NOT NULL,
  `enquiryId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `remark` text NOT NULL,
  `stage` varchar(191) DEFAULT NULL,
  `attempt` int(11) NOT NULL DEFAULT 1,
  `nextDate` datetime(3) DEFAULT NULL,
  `followupAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `enquiry_followups_enquiryId_idx` (`enquiryId`),
  KEY `enquiry_followups_userId_fkey` (`userId`),
  CONSTRAINT `enquiry_followups_enquiryId_fkey` FOREIGN KEY (`enquiryId`) REFERENCES `enquiries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `enquiry_followups_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enquiry_followups`
--

LOCK TABLES `enquiry_followups` WRITE;
/*!40000 ALTER TABLE `enquiry_followups` DISABLE KEYS */;
INSERT INTO `enquiry_followups` VALUES ('4666cd1a-d5f1-462b-ab81-d2370cb10f42','262f50e2-74a4-4475-8571-f55d77a9b8d8','f16e56db-fd62-4993-a487-7fb5906e5caf','[Smart Reminder] No follow-up for 38 days — automatic reminder created.','REMINDER',1,'2026-08-11 12:23:37.196','2026-08-11 12:23:37.196','2026-08-11 12:23:37.236'),('5c3d4611-327e-4f19-a298-10c3f47e4478','cf4ba80b-9f14-4321-aa4d-3c7c626ca345','f16e56db-fd62-4993-a487-7fb5906e5caf','[Smart Reminder] No follow-up for 36 days — automatic reminder created.','REMINDER',1,'2026-08-12 06:02:03.621','2026-08-12 06:02:03.621','2026-08-12 06:02:03.647');
/*!40000 ALTER TABLE `enquiry_followups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enquiry_import_batches`
--

DROP TABLE IF EXISTS `enquiry_import_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `enquiry_import_batches` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `branchId` varchar(191) DEFAULT NULL,
  `fileName` varchar(191) NOT NULL,
  `totalRows` int(11) NOT NULL DEFAULT 0,
  `uploaded` int(11) NOT NULL DEFAULT 0,
  `duplicates` int(11) NOT NULL DEFAULT 0,
  `failed` int(11) NOT NULL DEFAULT 0,
  `errors` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`errors`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `enquiry_import_batches_userId_idx` (`userId`),
  CONSTRAINT `enquiry_import_batches_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enquiry_import_batches`
--

LOCK TABLES `enquiry_import_batches` WRITE;
/*!40000 ALTER TABLE `enquiry_import_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `enquiry_import_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enquiry_import_duplicates`
--

DROP TABLE IF EXISTS `enquiry_import_duplicates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `enquiry_import_duplicates` (
  `id` varchar(191) NOT NULL,
  `batchId` varchar(191) NOT NULL,
  `rowData` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`rowData`)),
  `reason` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `enquiry_import_duplicates_batchId_idx` (`batchId`),
  CONSTRAINT `enquiry_import_duplicates_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `enquiry_import_batches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enquiry_import_duplicates`
--

LOCK TABLES `enquiry_import_duplicates` WRITE;
/*!40000 ALTER TABLE `enquiry_import_duplicates` DISABLE KEYS */;
/*!40000 ALTER TABLE `enquiry_import_duplicates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enquiry_note_attachments`
--

DROP TABLE IF EXISTS `enquiry_note_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `enquiry_note_attachments` (
  `id` varchar(191) NOT NULL,
  `noteId` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `fileName` varchar(191) NOT NULL,
  `filePath` varchar(191) NOT NULL,
  `fileSize` int(11) NOT NULL,
  `mimeType` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `enquiry_note_attachments_noteId_idx` (`noteId`),
  CONSTRAINT `enquiry_note_attachments_noteId_fkey` FOREIGN KEY (`noteId`) REFERENCES `enquiry_notes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enquiry_note_attachments`
--

LOCK TABLES `enquiry_note_attachments` WRITE;
/*!40000 ALTER TABLE `enquiry_note_attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `enquiry_note_attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enquiry_notes`
--

DROP TABLE IF EXISTS `enquiry_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `enquiry_notes` (
  `id` varchar(191) NOT NULL,
  `enquiryId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `content` text NOT NULL,
  `contentHtml` text DEFAULT NULL,
  `mentions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`mentions`)),
  `checklist` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`checklist`)),
  `isPinned` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `enquiry_notes_enquiryId_idx` (`enquiryId`),
  KEY `enquiry_notes_isPinned_idx` (`isPinned`),
  KEY `enquiry_notes_userId_fkey` (`userId`),
  CONSTRAINT `enquiry_notes_enquiryId_fkey` FOREIGN KEY (`enquiryId`) REFERENCES `enquiries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `enquiry_notes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enquiry_notes`
--

LOCK TABLES `enquiry_notes` WRITE;
/*!40000 ALTER TABLE `enquiry_notes` DISABLE KEYS */;
/*!40000 ALTER TABLE `enquiry_notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feature_flags`
--

DROP TABLE IF EXISTS `feature_flags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `feature_flags` (
  `id` varchar(191) NOT NULL,
  `key` varchar(191) NOT NULL,
  `module` varchar(191) NOT NULL DEFAULT 'legacy',
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `defaultEnabled` tinyint(1) NOT NULL DEFAULT 0,
  `dependsOn` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`dependsOn`)),
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `feature_flags_key_key` (`key`),
  KEY `feature_flags_module_idx` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feature_flags`
--

LOCK TABLES `feature_flags` WRITE;
/*!40000 ALTER TABLE `feature_flags` DISABLE KEYS */;
INSERT INTO `feature_flags` VALUES ('0204964a-99df-433b-ac51-3dc63ed42f21','reception.interested_register','reception','Interested Register','Counsellor can mark visitor as interested and create enquiry',1,'[\"reception.register\"]',2,1,'2026-07-04 06:34:52.561','2026-07-04 06:46:04.369'),('033b2172-cc12-498b-ac7c-a760b43f98d5','reception.auto_check_in','reception','Auto Check-In','Automatic check-in when visitor registers',0,'[\"reception.live_queue\"]',21,1,'2026-07-04 06:34:52.609','2026-07-04 06:46:04.460'),('0a6f5bf9-4b8a-491e-b7b8-b5aad7d0abff','communication.internal_chat','communication','Internal Chat',NULL,0,'[]',50,1,'2026-07-04 06:34:52.658','2026-07-04 06:46:04.513'),('11eaae6b-59eb-4a7e-9f1f-eec940d00cb8','reception.walk_in_queue','reception','Walk-in Queue Panel','Live queue panel in counsellor workspace',0,'[\"reception.live_queue\"]',18,1,'2026-07-04 06:34:52.599','2026-07-04 06:46:04.426'),('170edaa5-4c73-4d94-b7c2-3f0a8649e2d5','module_invoices','legacy','Invoices Module',NULL,1,'[]',0,1,'2026-07-04 06:34:53.245','2026-07-04 06:46:05.139'),('21d51d3f-34b3-46b9-ae55-91016369138b','finance.invoice','finance','Invoice',NULL,0,'[]',60,1,'2026-07-04 06:34:52.670','2026-07-04 06:46:04.535'),('28245e05-5e77-4872-803b-699193b440b1','module_students','legacy','Students Module',NULL,1,'[]',0,1,'2026-07-04 06:34:53.239','2026-07-04 06:46:05.132'),('28627b35-19ae-44c6-a385-14b05ce997f6','reception.whatsapp_token','reception','WhatsApp Token','Send token number via WhatsApp',0,'[\"reception.token_system\"]',20,1,'2026-07-04 06:34:52.606','2026-07-04 06:46:04.449'),('33878e2d-1cbf-4e27-b5e3-f3f4a239f053','automation.whatsapp','automation','WhatsApp Automation',NULL,0,'[]',42,1,'2026-07-04 06:34:52.643','2026-07-04 06:46:04.498'),('53006eef-b155-48e7-bc4e-5f210d250506','automation.auto_reminder','automation','Auto Reminder',NULL,0,'[]',43,1,'2026-07-04 06:34:52.648','2026-07-04 06:46:04.502'),('554cd926-26c1-4fb7-8145-6c118624f8fb','module_visas','legacy','Visas Module',NULL,1,'[]',0,1,'2026-07-04 06:34:53.242','2026-07-04 06:46:05.136'),('55ac2a39-340e-4623-bfb5-173c26de155d','reception.waiting_area','reception','Waiting Area Display','Waiting area screen for visitors',0,'[\"reception.live_queue\"]',11,1,'2026-07-04 06:34:52.577','2026-07-04 06:46:04.386'),('5df0c764-1622-4924-a950-ffd9881ed57e','module_partners','legacy','Partners Module',NULL,1,'[]',0,1,'2026-07-04 06:34:53.250','2026-07-04 06:46:05.143'),('650c4ad4-efae-4fde-a662-3bed58a7791d','automation.auto_followup','automation','Auto Follow-up',NULL,0,'[]',44,1,'2026-07-04 06:34:52.652','2026-07-04 06:46:04.505'),('6cc374e1-6e3a-4bf3-bdf0-6ff730b01083','reception.sms_token','reception','SMS Token','Send token number via SMS',0,'[\"reception.token_system\"]',19,1,'2026-07-04 06:34:52.603','2026-07-04 06:46:04.437'),('6de729be-cf1c-4011-ba23-58976ccd6db7','reporting.kpi','reporting','KPI',NULL,0,'[\"reporting.dashboard\"]',71,1,'2026-07-04 06:34:52.687','2026-07-04 06:46:04.553'),('6fb88161-fcc5-4514-87d7-835dabcb9237','reporting.analytics','reporting','Analytics',NULL,0,'[\"reporting.dashboard\"]',72,1,'2026-07-04 06:34:52.691','2026-07-04 06:46:04.556'),('7688a93b-7026-4dd9-a8eb-9a8e4707c056','reception.auto_token','reception','Auto Token','Automatically assign next token on registration',0,'[\"reception.token_system\"]',13,1,'2026-07-04 06:34:52.584','2026-07-04 06:46:04.393'),('7846c07b-7643-4b29-bcd9-f988d8852711','calendar.leave','calendar','Leave',NULL,1,'[]',35,1,'2026-07-04 06:34:52.633','2026-07-04 06:46:04.488'),('7bc5e05f-636c-46c3-80ea-afbd83b0e8ae','automation.sms','automation','SMS Automation',NULL,0,'[]',41,1,'2026-07-04 06:34:52.640','2026-07-04 06:46:04.495'),('80d52842-cde5-4956-a8bd-8b332fb4e1b2','reception.manual_student_conversion','reception','Manual Student Conversion','Manual convert enquiry to student',1,'[]',5,1,'2026-07-04 06:34:52.571','2026-07-04 06:46:04.381'),('850550b0-cbc0-42c4-be99-7a513fa47084','automation.email','automation','Email Automation',NULL,0,'[]',40,1,'2026-07-04 06:34:52.637','2026-07-04 06:46:04.491'),('8cabcf7d-5783-4629-8fb4-95eb49f44bcf','calendar.manual','calendar','Manual Calendar','Manual calendar events',1,'[]',30,1,'2026-07-04 06:34:52.613','2026-07-04 06:46:04.471'),('a06de637-4021-4eed-b674-d61748227c8d','reception.manual_counsellor_selection','reception','Manual Counsellor Selection','Reception or staff manually picks counsellor (Simple Mode)',1,'[\"reception.register\"]',3,1,'2026-07-04 06:34:52.565','2026-07-04 06:46:04.373'),('a1954449-2eac-4f9b-88e8-f515f9750418','communication.announcement','communication','Announcement',NULL,0,'[]',52,1,'2026-07-04 06:34:52.666','2026-07-04 06:46:04.529'),('a33ba760-82a8-46ad-add4-2295da5767e2','calendar.reminder','calendar','Reminder',NULL,1,'[]',32,1,'2026-07-04 06:34:52.621','2026-07-04 06:46:04.480'),('a57f14ab-0ed9-468c-ad0a-5c5338695f5c','communication.push_notification','communication','Push Notification',NULL,0,'[]',51,1,'2026-07-04 06:34:52.662','2026-07-04 06:46:04.524'),('a8e2dac3-2ae3-46ba-900d-cdd404f9eb5a','reception.register','reception','Reception Register','Allow visitor registration at reception / enquiry hub',1,'[]',1,1,'2026-07-04 06:34:52.556','2026-07-04 06:46:04.365'),('a979e457-7145-4122-8140-333914b39fc8','automation.notification_engine','automation','Notification Engine',NULL,0,'[]',45,1,'2026-07-04 06:34:52.655','2026-07-04 06:46:04.509'),('a9ecba5d-37ff-4aa7-a82c-a75672b8c99e','reporting.dashboard','reporting','Dashboard',NULL,1,'[]',70,1,'2026-07-04 06:34:52.683','2026-07-04 06:46:04.549'),('ac29c79e-ab38-43eb-a753-39a75c20e5f9','reception.manual_appointment','reception','Manual Appointment','Manual appointment booking without auto calendar sync',1,'[]',4,1,'2026-07-04 06:34:52.568','2026-07-04 06:46:04.378'),('b1d193e0-8e08-4a74-9c86-0a87a1233d7b','reception.token_system','reception','Token System','Generate token numbers for walk-in visitors',0,'[\"reception.live_queue\"]',12,1,'2026-07-04 06:34:52.581','2026-07-04 06:46:04.389'),('b871ca82-a220-4bb1-a351-277524ab1099','module_leads','legacy','Leads Module',NULL,1,'[]',0,1,'2026-07-04 06:34:53.235','2026-07-04 06:46:05.127'),('c1509743-374b-42ea-b4ba-7d2b39e53587','finance.due_reminder','finance','Due Reminder',NULL,0,'[\"finance.invoice\"]',62,1,'2026-07-04 06:34:52.678','2026-07-04 06:46:04.546'),('cddea6a3-4efc-470b-92cd-1bf7fa407586','reception.auto_counsellor_assignment','reception','Auto Counsellor Assignment','Automatically assign best available counsellor',0,'[\"reception.live_queue\"]',14,1,'2026-07-04 06:34:52.587','2026-07-04 06:46:04.397'),('cee382af-304b-4169-81d9-74f488d54d80','reception.queue_analytics','reception','Queue Analytics','Wait time and queue performance analytics',0,'[\"reception.live_queue\"]',17,1,'2026-07-04 06:34:52.595','2026-07-04 06:46:04.415'),('d156644c-8853-4333-a300-f025b1b3d7dd','calendar.task','calendar','Task',NULL,1,'[]',33,1,'2026-07-04 06:34:52.625','2026-07-04 06:46:04.483'),('d274daa4-8cda-4386-92c4-bc95a964f998','module_reports','legacy','Reports Module',NULL,1,'[]',0,1,'2026-07-04 06:34:53.253','2026-07-04 06:46:05.147'),('dc6800df-982d-472e-8575-a0fcde27f8d7','reception.queue_display_screen','reception','Queue Display Screen','TV / display board for branch queue',0,'[\"reception.live_queue\"]',16,1,'2026-07-04 06:34:52.592','2026-07-04 06:46:04.403'),('eab48338-f880-4edc-9490-d96032578747','module_enquiries','legacy','Enquiries Module',NULL,1,'[]',0,1,'2026-07-04 06:34:53.257','2026-07-04 06:46:05.150'),('ee095e94-ee64-403a-b572-de1c127462d4','calendar.holiday','calendar','Holiday',NULL,1,'[]',34,1,'2026-07-04 06:34:52.628','2026-07-04 06:46:04.486'),('ee75ccba-c1a4-42d9-8cb6-6b6f894de6cb','finance.payment_reminder','finance','Payment Reminder',NULL,0,'[\"finance.invoice\"]',61,1,'2026-07-04 06:34:52.674','2026-07-04 06:46:04.540'),('efef8bf3-2bfb-40f4-80bb-7221eea06bac','calendar.automatic','calendar','Automatic Calendar','Auto-sync follow-ups, appointments, deadlines to calendar',1,'[\"calendar.manual\"]',31,1,'2026-07-04 06:34:52.617','2026-07-04 06:46:04.476'),('f0027f9e-780b-4e6c-b8d0-dc7b812ae2ff','reception.counsellor_availability','reception','Counsellor Availability','Track counsellor presence and availability for routing',0,'[\"reception.auto_counsellor_assignment\"]',15,1,'2026-07-04 06:34:52.589','2026-07-04 06:46:04.400'),('febdb5f4-24fa-4253-83dc-b275574bc142','reception.live_queue','reception','Live Queue','Enterprise waiting queue with real-time updates',0,'[\"reception.register\"]',10,1,'2026-07-04 06:34:52.574','2026-07-04 06:46:04.384');
/*!40000 ALTER TABLE `feature_flags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fee_installments`
--

DROP TABLE IF EXISTS `fee_installments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fee_installments` (
  `id` varchar(191) NOT NULL,
  `feePlanId` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `dueDate` datetime(3) NOT NULL,
  `amountPaid` decimal(12,2) NOT NULL DEFAULT 0.00,
  `status` enum('PENDING','PAID','OVERDUE') NOT NULL DEFAULT 'PENDING',
  `paidAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fee_installments_feePlanId_idx` (`feePlanId`),
  CONSTRAINT `fee_installments_feePlanId_fkey` FOREIGN KEY (`feePlanId`) REFERENCES `fee_plans` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fee_installments`
--

LOCK TABLES `fee_installments` WRITE;
/*!40000 ALTER TABLE `fee_installments` DISABLE KEYS */;
/*!40000 ALTER TABLE `fee_installments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fee_plans`
--

DROP TABLE IF EXISTS `fee_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fee_plans` (
  `id` varchar(191) NOT NULL,
  `admissionId` varchar(191) DEFAULT NULL,
  `studentId` varchar(191) DEFAULT NULL,
  `totalAmount` decimal(12,2) NOT NULL,
  `discountAmount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `scholarshipAmount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `netAmount` decimal(12,2) NOT NULL,
  `currency` varchar(191) NOT NULL DEFAULT 'INR',
  `status` enum('DRAFT','ACTIVE','FULLY_PAID','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fee_plans_admissionId_key` (`admissionId`),
  UNIQUE KEY `fee_plans_studentId_key` (`studentId`),
  CONSTRAINT `fee_plans_admissionId_fkey` FOREIGN KEY (`admissionId`) REFERENCES `admissions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fee_plans_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fee_plans`
--

LOCK TABLES `fee_plans` WRITE;
/*!40000 ALTER TABLE `fee_plans` DISABLE KEYS */;
/*!40000 ALTER TABLE `fee_plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `followup_types`
--

DROP TABLE IF EXISTS `followup_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `followup_types` (
  `id` varchar(191) NOT NULL,
  `companyId` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `followup_types_companyId_code_key` (`companyId`,`code`),
  KEY `followup_types_companyId_idx` (`companyId`),
  KEY `followup_types_isActive_idx` (`isActive`),
  CONSTRAINT `followup_types_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `followup_types`
--

LOCK TABLES `followup_types` WRITE;
/*!40000 ALTER TABLE `followup_types` DISABLE KEYS */;
INSERT INTO `followup_types` VALUES ('083f7151-f7a2-4505-b168-6eac931eb033','a7c7c0df-60c6-4a73-88d0-92b2fa521655','OTHER','Other',NULL,1,8,'2026-08-11 12:55:29.033','2026-08-11 12:55:29.033',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('5e16bda2-31bb-438d-9c7d-1a02e1464473','a7c7c0df-60c6-4a73-88d0-92b2fa521655','CALL','Call',NULL,1,1,'2026-08-11 12:55:29.006','2026-08-11 12:55:29.006',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('68ea80e3-9df4-4b14-af8c-b6fc26f5889c','a7c7c0df-60c6-4a73-88d0-92b2fa521655','COUNSELLING','Counselling',NULL,1,5,'2026-08-11 12:55:29.024','2026-08-11 12:55:29.024',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('7805dc85-9ff9-40a0-bec3-34a494e6932b','a7c7c0df-60c6-4a73-88d0-92b2fa521655','WHATSAPP','WhatsApp',NULL,1,2,'2026-08-11 12:55:29.011','2026-08-11 12:55:29.011',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('8f25a480-12f2-472a-b2f9-20fa0892c958','a7c7c0df-60c6-4a73-88d0-92b2fa521655','EMAIL','Email',NULL,1,3,'2026-08-11 12:55:29.016','2026-08-11 12:55:29.016',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('9e252a2d-7c31-4ece-a2c0-dc584fd0d930','a7c7c0df-60c6-4a73-88d0-92b2fa521655','DOCUMENT_FOLLOW_UP','Document Follow-up',NULL,1,6,'2026-08-11 12:55:29.027','2026-08-11 12:55:29.027',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('ab7931a4-80a0-4de8-a5dd-7f9682686d06','a7c7c0df-60c6-4a73-88d0-92b2fa521655','PAYMENT_FOLLOW_UP','Payment Follow-up',NULL,1,7,'2026-08-11 12:55:29.030','2026-08-11 12:55:29.030',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('d5d3c21e-10f7-43a8-9083-b6c5fb07cebc','a7c7c0df-60c6-4a73-88d0-92b2fa521655','MEETING','Meeting',NULL,1,4,'2026-08-11 12:55:29.019','2026-08-11 12:55:29.019',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf');
/*!40000 ALTER TABLE `followup_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `intakes`
--

DROP TABLE IF EXISTS `intakes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `intakes` (
  `id` varchar(191) NOT NULL,
  `companyId` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `startDate` datetime(3) DEFAULT NULL,
  `endDate` datetime(3) DEFAULT NULL,
  `applicationDeadline` datetime(3) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `intakes_companyId_code_key` (`companyId`,`code`),
  KEY `intakes_companyId_idx` (`companyId`),
  KEY `intakes_isActive_idx` (`isActive`),
  CONSTRAINT `intakes_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `intakes`
--

LOCK TABLES `intakes` WRITE;
/*!40000 ALTER TABLE `intakes` DISABLE KEYS */;
INSERT INTO `intakes` VALUES ('1f84a55c-1d2b-4193-9721-a8de931b9886','a7c7c0df-60c6-4a73-88d0-92b2fa521655','MAY','May',NULL,NULL,NULL,NULL,1,5,'2026-08-11 12:55:28.614','2026-08-11 12:55:28.614',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('5dbcc21d-5d1a-4ba8-b4c3-f70f697cb28f','a7c7c0df-60c6-4a73-88d0-92b2fa521655','FEB','February',NULL,NULL,NULL,NULL,1,2,'2026-08-11 12:55:28.601','2026-08-11 12:55:28.601',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('6ba174c6-1033-4d57-a3c1-cbc4c0bd6ab8','a7c7c0df-60c6-4a73-88d0-92b2fa521655','AUG','August',NULL,NULL,NULL,NULL,1,8,'2026-08-11 12:55:28.626','2026-08-11 12:55:28.626',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('88e6191a-4b60-40bb-ae3f-e4e9da599f5a','a7c7c0df-60c6-4a73-88d0-92b2fa521655','SEP','September',NULL,NULL,NULL,NULL,1,9,'2026-08-11 12:55:28.630','2026-08-11 12:55:28.630',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('8e82de99-bd6c-4ac3-9bc4-c0bb5b33aa57','a7c7c0df-60c6-4a73-88d0-92b2fa521655','NOV','November',NULL,NULL,NULL,NULL,1,11,'2026-08-11 12:55:28.638','2026-08-11 12:55:28.638',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('8f40073c-8183-4844-b542-cc75fd72e1f1','a7c7c0df-60c6-4a73-88d0-92b2fa521655','JUN','June',NULL,NULL,NULL,NULL,1,6,'2026-08-11 12:55:28.618','2026-08-11 12:55:28.618',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('96ca4d7b-5536-4047-bf8b-1572e89ace18','a7c7c0df-60c6-4a73-88d0-92b2fa521655','MAR','March',NULL,NULL,NULL,NULL,1,3,'2026-08-11 12:55:28.606','2026-08-11 12:55:28.606',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('98a2fc54-06fc-419a-b70e-4a0fa12746e1','a7c7c0df-60c6-4a73-88d0-92b2fa521655','DEC','December',NULL,NULL,NULL,NULL,1,12,'2026-08-11 12:55:28.643','2026-08-11 12:55:28.643',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('b5ee8d18-c00e-4964-9d3a-eda3f6e0e098','a7c7c0df-60c6-4a73-88d0-92b2fa521655','OCT','October',NULL,NULL,NULL,NULL,1,10,'2026-08-11 12:55:28.633','2026-08-11 12:55:28.633',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('c92a158e-b8f0-4d89-b746-249dd025dbd5','a7c7c0df-60c6-4a73-88d0-92b2fa521655','JAN','January',NULL,NULL,NULL,NULL,1,1,'2026-08-11 12:55:28.596','2026-08-11 12:55:28.596',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('cb1beb20-0d77-4e6c-950e-bca3561e730e','a7c7c0df-60c6-4a73-88d0-92b2fa521655','APR','April',NULL,NULL,NULL,NULL,1,4,'2026-08-11 12:55:28.610','2026-08-11 12:55:28.610',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('f00c4e6a-37da-423b-a7da-621258d9b984','a7c7c0df-60c6-4a73-88d0-92b2fa521655','JUL','July',NULL,NULL,NULL,NULL,1,7,'2026-08-11 12:55:28.622','2026-08-11 12:55:28.622',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf');
/*!40000 ALTER TABLE `intakes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `invoices` (
  `id` varchar(191) NOT NULL,
  `studentId` varchar(191) DEFAULT NULL,
  `invoiceNo` varchar(191) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `tax` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total` decimal(12,2) NOT NULL,
  `currency` varchar(191) NOT NULL DEFAULT 'USD',
  `status` enum('DRAFT','SENT','PAID','PARTIAL','OVERDUE','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `dueDate` datetime(3) DEFAULT NULL,
  `paidAt` datetime(3) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoices_invoiceNo_key` (`invoiceNo`),
  KEY `invoices_studentId_idx` (`studentId`),
  KEY `invoices_status_idx` (`status`),
  KEY `invoices_invoiceNo_idx` (`invoiceNo`),
  CONSTRAINT `invoices_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lead_sources`
--

DROP TABLE IF EXISTS `lead_sources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `lead_sources` (
  `id` varchar(191) NOT NULL,
  `companyId` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `lead_sources_companyId_code_key` (`companyId`,`code`),
  KEY `lead_sources_companyId_idx` (`companyId`),
  KEY `lead_sources_isActive_idx` (`isActive`),
  CONSTRAINT `lead_sources_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lead_sources`
--

LOCK TABLES `lead_sources` WRITE;
/*!40000 ALTER TABLE `lead_sources` DISABLE KEYS */;
INSERT INTO `lead_sources` VALUES ('11b2fadd-c382-4aed-9fdd-6bc809374bbd','a7c7c0df-60c6-4a73-88d0-92b2fa521655','WEBSITE','Website',NULL,1,1,'2026-08-11 12:55:28.877','2026-08-11 12:55:28.877',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('1752ba5f-0028-45ab-bf83-284fc495818b','a7c7c0df-60c6-4a73-88d0-92b2fa521655','FACEBOOK','Facebook',NULL,1,5,'2026-08-11 12:55:28.895','2026-08-11 12:55:28.895',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('201fb5e4-e18e-4da6-8fbd-0efbf859c91a','a7c7c0df-60c6-4a73-88d0-92b2fa521655','EXISTING_STUDENT','Existing Student',NULL,1,11,'2026-08-11 12:55:28.916','2026-08-11 12:55:28.916',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('42ed67ce-a129-46bc-8d9d-a37a4eb3879b','a7c7c0df-60c6-4a73-88d0-92b2fa521655','GOOGLE','Google',NULL,1,4,'2026-08-11 12:55:28.891','2026-08-11 12:55:28.891',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('67ff5b1a-f1f8-4982-bf1b-6cd8b1dadf46','a7c7c0df-60c6-4a73-88d0-92b2fa521655','ADVERTISEMENT','Advertisement',NULL,1,8,'2026-08-11 12:55:28.905','2026-08-11 12:55:28.905',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('682f47ee-1c7e-4d67-8f9e-71d933dba8c2','a7c7c0df-60c6-4a73-88d0-92b2fa521655','REFERRAL','Referral',NULL,1,3,'2026-08-11 12:55:28.886','2026-08-11 12:55:28.886',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('6f461250-a399-4101-b2a8-949ad928ca39','a7c7c0df-60c6-4a73-88d0-92b2fa521655','OTHER','Other',NULL,1,12,'2026-08-11 12:55:28.919','2026-08-11 12:55:28.919',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('76b8e785-fcdb-48c1-ba52-c37f4b3c27b8','a7c7c0df-60c6-4a73-88d0-92b2fa521655','WHATSAPP','WhatsApp',NULL,1,7,'2026-08-11 12:55:28.901','2026-08-11 12:55:28.901',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('7b2ff6e4-936a-4fe1-a155-85e19bf55b7b','a7c7c0df-60c6-4a73-88d0-92b2fa521655','PARTNER','Partner',NULL,1,9,'2026-08-11 12:55:28.909','2026-08-11 12:55:28.909',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('bcf08a62-fc48-4595-bb47-596d94a485df','a7c7c0df-60c6-4a73-88d0-92b2fa521655','WALK_IN','Walk-in',NULL,1,2,'2026-08-11 12:55:28.881','2026-08-11 12:55:28.881',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('c56d6685-7c56-4760-a218-6ba8bc98a2c8','a7c7c0df-60c6-4a73-88d0-92b2fa521655','INSTAGRAM','Instagram',NULL,1,6,'2026-08-11 12:55:28.898','2026-08-11 12:55:28.898',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('ca4a38ed-346b-463d-9319-1c676f137319','a7c7c0df-60c6-4a73-88d0-92b2fa521655','AGENT','Agent',NULL,1,10,'2026-08-11 12:55:28.912','2026-08-11 12:55:28.912',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf');
/*!40000 ALTER TABLE `lead_sources` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lead_statuses`
--

DROP TABLE IF EXISTS `lead_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `lead_statuses` (
  `id` varchar(191) NOT NULL,
  `companyId` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `lead_statuses_companyId_code_key` (`companyId`,`code`),
  KEY `lead_statuses_companyId_idx` (`companyId`),
  KEY `lead_statuses_isActive_idx` (`isActive`),
  CONSTRAINT `lead_statuses_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lead_statuses`
--

LOCK TABLES `lead_statuses` WRITE;
/*!40000 ALTER TABLE `lead_statuses` DISABLE KEYS */;
INSERT INTO `lead_statuses` VALUES ('0f9876a9-9076-47cd-a6f3-de4efc9cec6a','a7c7c0df-60c6-4a73-88d0-92b2fa521655','CONVERTED','Converted',NULL,1,8,'2026-08-11 12:55:28.955','2026-08-11 12:55:28.955',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('3982492d-7a33-41cc-ac1b-37b79a469a6a','a7c7c0df-60c6-4a73-88d0-92b2fa521655','DEMO_SCHEDULED','Demo Scheduled',NULL,1,6,'2026-08-11 12:55:28.947','2026-08-11 12:55:28.947',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('4c18b762-3835-4962-a1d1-1b59c729d152','a7c7c0df-60c6-4a73-88d0-92b2fa521655','COUNSELLING','Counselling',NULL,1,4,'2026-08-11 12:55:28.939','2026-08-11 12:55:28.939',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('77bb5e5c-82f0-45cf-be3d-6b741f63f522','a7c7c0df-60c6-4a73-88d0-92b2fa521655','LOST','Lost',NULL,1,9,'2026-08-11 12:55:28.959','2026-08-11 12:55:28.959',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('7af00a59-d946-41b4-92bb-374e616a2a02','a7c7c0df-60c6-4a73-88d0-92b2fa521655','FOLLOW_UP','Follow-up',NULL,1,3,'2026-08-11 12:55:28.934','2026-08-11 12:55:28.934',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('b5f596b3-286b-45c6-8f39-9cf8f0fe4bcb','a7c7c0df-60c6-4a73-88d0-92b2fa521655','APPLICATION_STARTED','Application Started',NULL,1,7,'2026-08-11 12:55:28.951','2026-08-11 12:55:28.951',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('be42d3d2-9cfc-418b-9d0d-2fcc65bb8eb6','a7c7c0df-60c6-4a73-88d0-92b2fa521655','CLOSED','Closed',NULL,1,10,'2026-08-11 12:55:28.962','2026-08-11 12:55:28.962',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('de180adc-ce87-4b65-b830-a5fc66bd556b','a7c7c0df-60c6-4a73-88d0-92b2fa521655','INTERESTED','Interested',NULL,1,5,'2026-08-11 12:55:28.943','2026-08-11 12:55:28.943',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('e55724be-7375-41df-abd5-82b29cc011ad','a7c7c0df-60c6-4a73-88d0-92b2fa521655','CONTACTED','Contacted',NULL,1,2,'2026-08-11 12:55:28.931','2026-08-11 12:55:28.931',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('ef390a9d-8dfc-4427-b11f-d52b1cba2c7e','a7c7c0df-60c6-4a73-88d0-92b2fa521655','NEW','New',NULL,1,1,'2026-08-11 12:55:28.926','2026-08-11 12:55:28.926',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf');
/*!40000 ALTER TABLE `lead_statuses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leads`
--

DROP TABLE IF EXISTS `leads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `leads` (
  `id` varchar(191) NOT NULL,
  `leadCode` varchar(191) NOT NULL,
  `tokenNumber` varchar(191) NOT NULL,
  `branchId` varchar(191) NOT NULL,
  `assignedToId` varchar(191) DEFAULT NULL,
  `receptionUserId` varchar(191) DEFAULT NULL,
  `firstName` varchar(191) NOT NULL,
  `lastName` varchar(191) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `phone` varchar(191) NOT NULL,
  `country` varchar(191) DEFAULT NULL,
  `interestedCourse` varchar(191) DEFAULT NULL,
  `source` varchar(191) DEFAULT 'Walk-in',
  `status` enum('WALK_IN','WAITING','IN_COUNSELLING','COMPLETED','CANCELLED','APPOINTMENT') NOT NULL DEFAULT 'WAITING',
  `priority` enum('NORMAL','HIGH','VIP') NOT NULL DEFAULT 'NORMAL',
  `notes` text DEFAULT NULL,
  `followUpAt` datetime(3) DEFAULT NULL,
  `walkInAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `convertedAt` datetime(3) DEFAULT NULL,
  `studentId` varchar(191) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `leads_leadCode_key` (`leadCode`),
  UNIQUE KEY `leads_studentId_key` (`studentId`),
  KEY `leads_branchId_idx` (`branchId`),
  KEY `leads_assignedToId_idx` (`assignedToId`),
  KEY `leads_receptionUserId_idx` (`receptionUserId`),
  KEY `leads_status_idx` (`status`),
  KEY `leads_priority_idx` (`priority`),
  KEY `leads_followUpAt_idx` (`followUpAt`),
  KEY `leads_walkInAt_idx` (`walkInAt`),
  KEY `leads_phone_idx` (`phone`),
  KEY `leads_leadCode_idx` (`leadCode`),
  KEY `leads_tokenNumber_idx` (`tokenNumber`),
  CONSTRAINT `leads_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `leads_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `leads_receptionUserId_fkey` FOREIGN KEY (`receptionUserId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `leads_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leads`
--

LOCK TABLES `leads` WRITE;
/*!40000 ALTER TABLE `leads` DISABLE KEYS */;
INSERT INTO `leads` VALUES ('41c1ec0d-ff02-4741-9aa8-8acea690e181','MAIN-LEAD-2026-000002','H-101','caabc1ee-3ff0-496c-802a-746bbbbae703','f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf','Rahul','Patel','rahul.patel@test.com','1234567890',NULL,NULL,'Walk-in','WAITING','NORMAL','123',NULL,'2026-07-06 07:45:07.514',NULL,NULL,'{\"entryType\":\"WALK_IN\",\"qrPayload\":{\"type\":\"LEAD\",\"leadCode\":\"MAIN-LEAD-2026-000002\",\"tokenNumber\":\"H-101\"},\"gender\":null,\"dateOfBirth\":null,\"city\":null,\"interestedCountry\":null,\"studyLevel\":null,\"preferredLanguage\":null,\"visitPurpose\":\"Study Abroad Enquiry\"}','2026-07-06 07:45:07.516','2026-07-06 07:45:07.516',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('5a663213-88f8-4414-aa01-04ffe6779a75','MAIN-LEAD-2026-000001','H-101','caabc1ee-3ff0-496c-802a-746bbbbae703','f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf','Darshil','Kachhadiya','kachhadiyadarshil2@gmail.com','8799338055',NULL,NULL,'Walk-in','WAITING','NORMAL','new student',NULL,'2026-07-04 07:12:53.251',NULL,NULL,'{\"entryType\":\"WALK_IN\",\"qrPayload\":{\"type\":\"LEAD\",\"leadCode\":\"MAIN-LEAD-2026-000001\",\"tokenNumber\":\"H-101\"},\"gender\":null,\"dateOfBirth\":null,\"city\":null,\"interestedCountry\":null,\"studyLevel\":null,\"preferredLanguage\":null,\"visitPurpose\":\"Study Abroad Enquiry\"}','2026-07-04 07:12:53.254','2026-07-04 07:12:53.254',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf');
/*!40000 ALTER TABLE `leads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lost_reasons`
--

DROP TABLE IF EXISTS `lost_reasons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `lost_reasons` (
  `id` varchar(191) NOT NULL,
  `companyId` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `lost_reasons_companyId_code_key` (`companyId`,`code`),
  KEY `lost_reasons_companyId_idx` (`companyId`),
  KEY `lost_reasons_isActive_idx` (`isActive`),
  CONSTRAINT `lost_reasons_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lost_reasons`
--

LOCK TABLES `lost_reasons` WRITE;
/*!40000 ALTER TABLE `lost_reasons` DISABLE KEYS */;
INSERT INTO `lost_reasons` VALUES ('13a118c4-5830-4eb2-a813-9df929965fd8','a7c7c0df-60c6-4a73-88d0-92b2fa521655','DOCUMENTATION','Documentation',NULL,1,5,'2026-08-11 12:55:28.984','2026-08-11 12:55:28.984',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('4747b2d4-5832-4185-a8f1-9a0be1209df4','a7c7c0df-60c6-4a73-88d0-92b2fa521655','CHANGED_COUNTRY','Changed Country',NULL,1,3,'2026-08-11 12:55:28.978','2026-08-11 12:55:28.978',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('5dc072df-fde1-4135-8c14-f4105b350237','a7c7c0df-60c6-4a73-88d0-92b2fa521655','BUDGET','Budget',NULL,1,1,'2026-08-11 12:55:28.967','2026-08-11 12:55:28.967',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('631f78ec-1ce1-49e0-8694-05f0d85b1f9c','a7c7c0df-60c6-4a73-88d0-92b2fa521655','COMPETITOR','Competitor',NULL,1,8,'2026-08-11 12:55:28.996','2026-08-11 12:55:28.996',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('834df4d0-99f6-4e5b-90a6-c9246c6a865d','a7c7c0df-60c6-4a73-88d0-92b2fa521655','NOT_INTERESTED','Not Interested',NULL,1,2,'2026-08-11 12:55:28.974','2026-08-11 12:55:28.974',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('a84b017c-f140-4de4-97df-184267a9ca94','a7c7c0df-60c6-4a73-88d0-92b2fa521655','LOW_QUALIFICATION','Low Qualification',NULL,1,4,'2026-08-11 12:55:28.981','2026-08-11 12:55:28.981',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('bfad1a96-b8cc-4fa2-9ba8-49bcbaa5695b','a7c7c0df-60c6-4a73-88d0-92b2fa521655','OTHER','Other',NULL,1,9,'2026-08-11 12:55:28.999','2026-08-11 12:55:28.999',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('ce275ec6-9b88-4774-859a-8d4751b1ba30','a7c7c0df-60c6-4a73-88d0-92b2fa521655','NO_RESPONSE','No Response',NULL,1,7,'2026-08-11 12:55:28.992','2026-08-11 12:55:28.992',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('e2eb6270-04b1-4f48-b5ca-2a824def653c','a7c7c0df-60c6-4a73-88d0-92b2fa521655','VISA_REFUSED','Visa Refused',NULL,1,6,'2026-08-11 12:55:28.988','2026-08-11 12:55:28.988',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf');
/*!40000 ALTER TABLE `lost_reasons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `master_items`
--

DROP TABLE IF EXISTS `master_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `master_items` (
  `id` varchar(191) NOT NULL,
  `companyId` varchar(191) NOT NULL,
  `category` varchar(191) NOT NULL,
  `label` varchar(191) NOT NULL,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `master_items_companyId_category_label_key` (`companyId`,`category`,`label`),
  KEY `master_items_companyId_category_idx` (`companyId`,`category`),
  KEY `master_items_category_idx` (`category`),
  CONSTRAINT `master_items_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `master_items`
--

LOCK TABLES `master_items` WRITE;
/*!40000 ALTER TABLE `master_items` DISABLE KEYS */;
INSERT INTO `master_items` VALUES ('0021958c-5fb3-4975-a113-7f854c71bc0e','a7c7c0df-60c6-4a73-88d0-92b2fa521655','university','Monash University',10,1,'{}','2026-08-11 12:28:38.163','2026-08-11 12:28:38.163',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('0093904a-29a8-48f8-a12c-5b9ffb05d0df','a7c7c0df-60c6-4a73-88d0-92b2fa521655','fee-type','Service Charge',6,1,'{}','2026-08-11 12:28:38.724','2026-08-11 12:28:38.724',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('021187d5-1920-41aa-ba81-09427b9ef620','a7c7c0df-60c6-4a73-88d0-92b2fa521655','currency','AED',8,1,'{}','2026-08-11 12:28:38.811','2026-08-11 12:28:38.811',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('027b72ed-eaef-4ca2-9e0d-3eebed2d9e8f','a7c7c0df-60c6-4a73-88d0-92b2fa521655','department','Admissions',2,1,'{}','2026-08-11 12:28:38.050','2026-08-11 12:28:38.050',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('02dbcde8-286a-4cf0-ba26-6b33e051522b','a7c7c0df-60c6-4a73-88d0-92b2fa521655','visit-purpose','Visa Consultation',2,1,'{}','2026-07-04 06:46:05.252','2026-07-04 06:46:05.252',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('03a1ab97-857b-401f-8540-e9dd0617efd4','a7c7c0df-60c6-4a73-88d0-92b2fa521655','tags','Scholarship Interest',10,1,'{}','2026-08-11 12:28:39.082','2026-08-11 12:28:39.082',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('05342018-669b-4878-8261-09452083186e','a7c7c0df-60c6-4a73-88d0-92b2fa521655','visit-purpose','SOP / LOR Guidance',9,1,'{}','2026-08-11 12:28:37.990','2026-08-11 12:28:37.990',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('06d4cccc-d1d7-4cca-bffa-d89eacd355b5','a7c7c0df-60c6-4a73-88d0-92b2fa521655','qualification','PhD / Doctorate',6,1,'{}','2026-08-11 12:28:38.445','2026-08-11 12:28:38.445',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('08cc7d4b-59c5-40fd-8359-8297b4f598be','a7c7c0df-60c6-4a73-88d0-92b2fa521655','enquiry-status','DROPPED',8,1,'{}','2026-08-11 12:28:38.959','2026-08-11 12:28:38.959',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('09457aae-8b58-4f86-9a4d-d1e84a178e3f','a7c7c0df-60c6-4a73-88d0-92b2fa521655','tags','Parent Involved',8,1,'{}','2026-08-11 12:28:38.994','2026-08-11 12:28:38.994',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('09796b32-9345-4ad6-9c5a-fc3060bbb05e','a7c7c0df-60c6-4a73-88d0-92b2fa521655','enquiry-status','NEW',1,1,'{}','2026-08-11 12:28:38.934','2026-08-11 12:28:38.934',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('0a77976b-e141-43cc-83e6-de4df290d7a1','a7c7c0df-60c6-4a73-88d0-92b2fa521655','embassy','Irish Embassy – New Delhi',9,1,'{}','2026-08-11 12:28:38.701','2026-08-11 12:28:38.701',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('0b4ce1ce-ba82-4322-a72e-7bd6916f4595','a7c7c0df-60c6-4a73-88d0-92b2fa521655','fee-type','Visa Filing Fee',3,1,'{}','2026-08-11 12:28:38.713','2026-08-11 12:28:38.713',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('0c6b0e04-923a-43d0-b1c9-c9d80ac4790f','a7c7c0df-60c6-4a73-88d0-92b2fa521655','tax','GST 12%',2,1,'{}','2026-08-11 12:28:38.822','2026-08-11 12:28:38.822',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('0cfa1d6b-cdc8-414a-bf82-f44cdbfd27c7','a7c7c0df-60c6-4a73-88d0-92b2fa521655','payment-mode','UPI',2,1,'{}','2026-08-11 12:28:38.750','2026-08-11 12:28:38.750',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('0d26e3fd-5681-43d0-a13d-d346f3f1b5c5','a7c7c0df-60c6-4a73-88d0-92b2fa521655','intake','Oct-2026',3,1,'{}','2026-08-11 12:28:38.270','2026-08-11 12:28:38.270',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('0d37a8b4-1893-474a-b8fe-f15bd9e00e36','a7c7c0df-60c6-4a73-88d0-92b2fa521655','course','Architecture',15,1,'{}','2026-08-11 12:28:38.245','2026-08-11 12:28:38.245',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('0d683bfb-0788-47b7-b348-1f77fba0bbe5','a7c7c0df-60c6-4a73-88d0-92b2fa521655','counsellor-skill','IELTS Coaching',7,1,'{}','2026-08-11 12:28:38.032','2026-08-11 12:28:38.032',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('0f6edf92-dae4-4f18-aacc-44289c013a39','a7c7c0df-60c6-4a73-88d0-92b2fa521655','visit-purpose','IELTS / Coaching Demo',3,1,'{}','2026-07-04 06:46:05.258','2026-07-04 06:46:05.258',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('0fd169ce-2a27-485d-be03-f811b63ba343','a7c7c0df-60c6-4a73-88d0-92b2fa521655','tax','Exempt',4,1,'{}','2026-08-11 12:28:38.836','2026-08-11 12:28:38.836',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('10606d56-bb3a-4d1f-98bd-ea625067aa00','a7c7c0df-60c6-4a73-88d0-92b2fa521655','intake','Jul-2027',12,1,'{}','2026-08-11 12:28:38.314','2026-08-11 12:28:38.314',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('1130694b-6b9f-458c-a724-4c7419fdb7e8','a7c7c0df-60c6-4a73-88d0-92b2fa521655','embassy','VFS Global – Ahmedabad (UK)',4,1,'{}','2026-08-11 12:28:38.681','2026-08-11 12:28:38.681',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('11c4ecb9-a5af-4f24-8db6-7670a64c48d9','a7c7c0df-60c6-4a73-88d0-92b2fa521655','visa-type','Student Visa (New Zealand)',6,1,'{}','2026-08-11 12:28:38.595','2026-08-11 12:28:38.595',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('13df54ae-0fc4-4414-a482-3ed550b551e1','a7c7c0df-60c6-4a73-88d0-92b2fa521655','enquiry-status','CONTACTED',2,1,'{}','2026-08-11 12:28:38.937','2026-08-11 12:28:38.937',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('13eb4f5a-2623-4368-85d5-c2630eb212a1','a7c7c0df-60c6-4a73-88d0-92b2fa521655','course','Diploma in Business',17,1,'{}','2026-08-11 12:28:38.253','2026-08-11 12:28:38.253',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('141fe85f-886b-46e5-8368-9ab29087a4f1','a7c7c0df-60c6-4a73-88d0-92b2fa521655','qualification','10th Standard',1,1,'{}','2026-08-11 12:28:38.375','2026-08-11 12:28:38.375',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('149a4957-aeed-4499-b25c-e8f727427eca','a7c7c0df-60c6-4a73-88d0-92b2fa521655','intake','Jan-2027',6,1,'{}','2026-08-11 12:28:38.283','2026-08-11 12:28:38.283',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('16f7c065-b796-419d-89bf-f49b5bd84472','a7c7c0df-60c6-4a73-88d0-92b2fa521655','highestQual','Diploma',3,1,'{}','2026-08-11 12:28:38.467','2026-08-11 12:28:38.467',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('178ca876-165c-4f28-84b3-e6dcd2a3c5c7','a7c7c0df-60c6-4a73-88d0-92b2fa521655','intake','Jun-2027',11,1,'{}','2026-08-11 12:28:38.309','2026-08-11 12:28:38.309',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('182b5d95-86b0-4a24-bdfa-46c66bca78da','a7c7c0df-60c6-4a73-88d0-92b2fa521655','tax','GST 18%',1,1,'{}','2026-08-11 12:28:38.815','2026-08-11 12:28:38.815',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('18435ab7-a082-4e08-9f9b-3bf3cfe8e679','a7c7c0df-60c6-4a73-88d0-92b2fa521655','payment-mode','Cash',1,1,'{}','2026-08-11 12:28:38.745','2026-08-11 12:28:38.745',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('1a0a77c6-70e0-4d48-b9b0-3d2d461132a5','a7c7c0df-60c6-4a73-88d0-92b2fa521655','counsellor-skill','Finance Counselling',8,1,'{}','2026-08-11 12:28:38.036','2026-08-11 12:28:38.036',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('1af9fa87-d710-4113-8a2d-d11531ffa593','a7c7c0df-60c6-4a73-88d0-92b2fa521655','enquiry-status','DEMO_SCHEDULED',5,1,'{}','2026-08-11 12:28:38.949','2026-08-11 12:28:38.949',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('1c504bd5-7eb9-4c8b-b5e3-92e2c3401dc4','a7c7c0df-60c6-4a73-88d0-92b2fa521655','course','Graphic Design',16,1,'{}','2026-08-11 12:28:38.249','2026-08-11 12:28:38.249',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('1e156789-d4a4-44bd-b783-85f61037612a','a7c7c0df-60c6-4a73-88d0-92b2fa521655','university','University of Alberta',4,1,'{}','2026-08-11 12:28:38.136','2026-08-11 12:28:38.136',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('1e82dc1c-a963-4e67-9174-0453abae8faf','a7c7c0df-60c6-4a73-88d0-92b2fa521655','course','Nursing',12,1,'{}','2026-08-11 12:28:38.232','2026-08-11 12:28:38.232',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('1e882505-0bc1-4b34-a409-299226b6a26f','a7c7c0df-60c6-4a73-88d0-92b2fa521655','embassy','British High Commission – New Delhi',3,1,'{}','2026-08-11 12:28:38.677','2026-08-11 12:28:38.677',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('2099f5e3-de96-4c8f-acff-abfddf6c28b1','a7c7c0df-60c6-4a73-88d0-92b2fa521655','nationality','Nepal',2,1,'{}','2026-08-11 12:28:39.107','2026-08-11 12:28:39.107',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('227da473-4163-4c78-b11e-0698e20c6e9a','a7c7c0df-60c6-4a73-88d0-92b2fa521655','gender','Female',2,1,'{}','2026-08-11 12:28:39.090','2026-08-11 12:28:39.090',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('22b46e5e-abf1-47b3-9f36-eb4c009cbc8b','a7c7c0df-60c6-4a73-88d0-92b2fa521655','tax','GST 5%',3,1,'{}','2026-08-11 12:28:38.831','2026-08-11 12:28:38.831',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('23073bff-3aa6-4e27-a398-d2f4afc1887f','a7c7c0df-60c6-4a73-88d0-92b2fa521655','fee-type','University Deposit',7,1,'{}','2026-08-11 12:28:38.729','2026-08-11 12:28:38.729',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('2373302e-f6fd-42f9-91f7-10d9915d4337','a7c7c0df-60c6-4a73-88d0-92b2fa521655','counsellor-skill','UK Admissions',2,1,'{}','2026-08-11 12:28:38.005','2026-08-11 12:28:38.005',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('23841627-dd8b-4e18-ad0b-c400baf5469b','a7c7c0df-60c6-4a73-88d0-92b2fa521655','university','University of Toronto',1,1,'{}','2026-08-11 12:28:38.123','2026-08-11 12:28:38.123',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('2471a41f-352a-4276-b5b3-2068d51b98b1','a7c7c0df-60c6-4a73-88d0-92b2fa521655','country','Ireland',7,1,'{}','2026-08-11 12:28:38.107','2026-08-11 12:28:38.107',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('2525fca3-3319-4bbc-b7bc-b5aa2de9250f','a7c7c0df-60c6-4a73-88d0-92b2fa521655','visit-purpose','University Shortlisting',8,1,'{}','2026-08-11 12:28:37.985','2026-08-11 12:28:37.985',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('25cdd816-530e-4903-918e-9946eb9495c4','a7c7c0df-60c6-4a73-88d0-92b2fa521655','university','University of Manchester',6,1,'{}','2026-08-11 12:28:38.145','2026-08-11 12:28:38.145',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('260f7238-6af6-4d6a-8c72-aac29e562608','a7c7c0df-60c6-4a73-88d0-92b2fa521655','intake','Feb-2027',7,1,'{}','2026-08-11 12:28:38.289','2026-08-11 12:28:38.289',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('263bdf18-7123-4d71-9822-4ab7d80e0341','a7c7c0df-60c6-4a73-88d0-92b2fa521655','enquiry-status','CONVERTED',7,1,'{}','2026-08-11 12:28:38.955','2026-08-11 12:28:38.955',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('299d72dc-7998-4082-b209-5ec21d950631','a7c7c0df-60c6-4a73-88d0-92b2fa521655','maritalStatus','Divorced',3,1,'{}','2026-08-11 12:28:39.140','2026-08-11 12:28:39.140',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('2a0355b5-db6c-4ed8-a2c1-5186d0bb48c0','a7c7c0df-60c6-4a73-88d0-92b2fa521655','tags','High Priority',4,1,'{}','2026-08-11 12:28:38.978','2026-08-11 12:28:38.978',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('2a0f00a0-faa8-46ac-8ad3-fc13b155cf69','a7c7c0df-60c6-4a73-88d0-92b2fa521655','university','Technical University of Munich',14,1,'{}','2026-08-11 12:28:38.181','2026-08-11 12:28:38.181',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('2a93a9ce-e67d-4e2f-8e5b-475f3266cb71','a7c7c0df-60c6-4a73-88d0-92b2fa521655','lead-source','Phone Call',10,1,'{}','2026-08-11 12:28:38.886','2026-08-11 12:28:38.886',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('2b4d10f2-953a-49bd-826f-9f5e4efee086','a7c7c0df-60c6-4a73-88d0-92b2fa521655','intake','Sep-2027',14,1,'{}','2026-08-11 12:28:38.324','2026-08-11 12:28:38.324',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('2bc1bb07-826c-44c7-a067-d04ed57bb449','a7c7c0df-60c6-4a73-88d0-92b2fa521655','embassy','German Consulate – Mumbai',7,1,'{}','2026-08-11 12:28:38.693','2026-08-11 12:28:38.693',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('2cd784ee-e208-4a30-8893-24201d0f4598','a7c7c0df-60c6-4a73-88d0-92b2fa521655','intake','Jun-2028',23,1,'{}','2026-08-11 12:28:38.366','2026-08-11 12:28:38.366',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('2d452fd8-8d2f-4c59-afc6-aebd8ef8f6fb','a7c7c0df-60c6-4a73-88d0-92b2fa521655','visit-purpose','Documentation Support',4,1,'{}','2026-07-04 06:46:05.263','2026-07-04 06:46:05.263',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('2eceab61-4767-4e49-917f-1bb7db33c2fa','a7c7c0df-60c6-4a73-88d0-92b2fa521655','university','McGill University',3,1,'{}','2026-08-11 12:28:38.132','2026-08-11 12:28:38.132',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('2f0c0ffc-0ed4-42c2-9824-07dd306f2727','a7c7c0df-60c6-4a73-88d0-92b2fa521655','intake','May-2028',22,1,'{}','2026-08-11 12:28:38.362','2026-08-11 12:28:38.362',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('2f7057ed-dbcc-44e3-8f2c-0ba1724aae9f','a7c7c0df-60c6-4a73-88d0-92b2fa521655','source','Phone Call',10,1,'{}','2026-08-11 12:28:38.931','2026-08-11 12:28:38.931',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('301e3440-1d65-4986-8e8b-a9a4080d8cda','a7c7c0df-60c6-4a73-88d0-92b2fa521655','countryCode','+971 UAE',6,1,'{}','2026-08-11 12:28:39.178','2026-08-11 12:28:39.178',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('31f662b6-9d27-410f-9ccb-03b272174e5a','a7c7c0df-60c6-4a73-88d0-92b2fa521655','department','Student Support',8,1,'{}','2026-08-11 12:28:38.074','2026-08-11 12:28:38.074',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('32d221a3-4ef9-4bc0-a2f9-dcfa2eae5e0c','a7c7c0df-60c6-4a73-88d0-92b2fa521655','intake','Feb-2028',19,1,'{}','2026-08-11 12:28:38.344','2026-08-11 12:28:38.344',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('33043a4d-6630-4f16-89eb-fdec047d465d','a7c7c0df-60c6-4a73-88d0-92b2fa521655','source','Website',1,1,'{}','2026-08-11 12:28:38.897','2026-08-11 12:28:38.897',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('331f6135-15ec-4a6a-81dd-87f915bab16c','a7c7c0df-60c6-4a73-88d0-92b2fa521655','university','University of British Columbia',2,1,'{}','2026-08-11 12:28:38.127','2026-08-11 12:28:38.127',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('332c5ad5-98cb-4295-832c-7d886076ec3b','a7c7c0df-60c6-4a73-88d0-92b2fa521655','document-checklist','Offer Letter',10,1,'{}','2026-08-11 12:28:38.649','2026-08-11 12:28:38.649',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('34b4a2e3-71c7-4278-a4fb-2e79d0c0e068','a7c7c0df-60c6-4a73-88d0-92b2fa521655','tags','Hot Lead',1,1,'{}','2026-08-11 12:28:38.968','2026-08-11 12:28:38.968',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('36b38d1f-829b-4855-9997-570688e680d8','a7c7c0df-60c6-4a73-88d0-92b2fa521655','source','Referral',3,1,'{}','2026-08-11 12:28:38.904','2026-08-11 12:28:38.904',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('372976a5-7d51-4e1e-82a9-ad42c44ae8aa','a7c7c0df-60c6-4a73-88d0-92b2fa521655','applyLevel','PhD',5,1,'{}','2026-08-11 12:28:38.565','2026-08-11 12:28:38.565',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('38357fd3-4e49-4168-b03c-7cdb9efa8866','a7c7c0df-60c6-4a73-88d0-92b2fa521655','course','BBA',3,1,'{}','2026-08-11 12:28:38.196','2026-08-11 12:28:38.196',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('393a738c-c92b-4c84-9018-a075f9297ffd','a7c7c0df-60c6-4a73-88d0-92b2fa521655','enquiry-status','IN_PROGRESS',3,1,'{}','2026-08-11 12:28:38.941','2026-08-11 12:28:38.941',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('3a35b9ce-2f64-4ae3-8749-94e43ebc2407','a7c7c0df-60c6-4a73-88d0-92b2fa521655','course','Business Analytics',6,1,'{}','2026-08-11 12:28:38.207','2026-08-11 12:28:38.207',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('3a4740d5-f464-4481-be15-933a32aec026','a7c7c0df-60c6-4a73-88d0-92b2fa521655','testName','GRE',5,1,'{}','2026-08-11 12:28:39.217','2026-08-11 12:28:39.217',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('3ad998bd-c5ce-4dd2-841c-cdac8fa29c34','a7c7c0df-60c6-4a73-88d0-92b2fa521655','course','MBA',1,1,'{}','2026-08-11 12:28:38.188','2026-08-11 12:28:38.188',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('3c4f973b-d19d-46d3-b4a0-2b2a5e610227','a7c7c0df-60c6-4a73-88d0-92b2fa521655','visit-purpose','Fee / Payment Query',6,1,'{}','2026-07-04 06:46:05.270','2026-07-04 06:46:05.270',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('3fa39727-b3cd-4e6e-917d-00d0fa3dddbb','a7c7c0df-60c6-4a73-88d0-92b2fa521655','communication-template','Offer Received',5,1,'{}','2026-08-11 12:28:39.253','2026-08-11 12:28:39.253',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('4038d26a-6e9b-4e60-939c-69b9c773fd54','a7c7c0df-60c6-4a73-88d0-92b2fa521655','fee-type','Counselling Fee',1,1,'{}','2026-08-11 12:28:38.706','2026-08-11 12:28:38.706',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('405d6b85-8856-4cd7-bfa2-a9694b8b607f','a7c7c0df-60c6-4a73-88d0-92b2fa521655','source','Education Fair',7,1,'{}','2026-08-11 12:28:38.919','2026-08-11 12:28:38.919',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('4065302d-d0b2-421a-93a3-3cb674c72a96','a7c7c0df-60c6-4a73-88d0-92b2fa521655','source','Google Ads',5,1,'{}','2026-08-11 12:28:38.911','2026-08-11 12:28:38.911',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('40c9b495-13db-497e-881f-e7342bb53528','a7c7c0df-60c6-4a73-88d0-92b2fa521655','testName','PTE Academic',3,1,'{}','2026-08-11 12:28:39.208','2026-08-11 12:28:39.208',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('430f03b6-0c2f-4e4e-9688-9c72de8f65d2','a7c7c0df-60c6-4a73-88d0-92b2fa521655','document-checklist','IELTS / PTE Scorecard',4,1,'{}','2026-08-11 12:28:38.626','2026-08-11 12:28:38.626',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('43372d12-1ead-407a-9775-d800d5eaaaeb','a7c7c0df-60c6-4a73-88d0-92b2fa521655','lead-source','Instagram',6,1,'{}','2026-08-11 12:28:38.869','2026-08-11 12:28:38.869',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('43910622-4061-4063-b1e8-df41cdd4934c','a7c7c0df-60c6-4a73-88d0-92b2fa521655','currency','EUR',6,1,'{}','2026-08-11 12:28:38.802','2026-08-11 12:28:38.802',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('43a841f1-d2a4-49d1-83fd-cf421d9a6307','a7c7c0df-60c6-4a73-88d0-92b2fa521655','testName','IELTS',1,1,'{}','2026-08-11 12:28:39.200','2026-08-11 12:28:39.200',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('48e367ac-49b8-49e9-ac17-5505949f5e14','a7c7c0df-60c6-4a73-88d0-92b2fa521655','embassy','Canadian High Commission – New Delhi',1,1,'{}','2026-08-11 12:28:38.669','2026-08-11 12:28:38.669',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('4ab6d192-2fb0-45d9-b48a-441cfbb42daa','a7c7c0df-60c6-4a73-88d0-92b2fa521655','intake','Aug-2026',1,1,'{}','2026-08-11 12:28:38.262','2026-08-11 12:28:38.262',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('4b59853f-4357-4fc3-a51d-f75b46f618b2','a7c7c0df-60c6-4a73-88d0-92b2fa521655','document-checklist','Affidavit of Support',9,1,'{}','2026-08-11 12:28:38.645','2026-08-11 12:28:38.645',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('4fe9f5b6-5e15-448e-a9f3-1936328f5820','a7c7c0df-60c6-4a73-88d0-92b2fa521655','course','MBA Finance',2,1,'{}','2026-08-11 12:28:38.191','2026-08-11 12:28:38.191',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('50a69bfa-ad1d-4df5-bf5a-53063098a22b','a7c7c0df-60c6-4a73-88d0-92b2fa521655','counsellor-skill','Visa Filing',6,1,'{}','2026-08-11 12:28:38.027','2026-08-11 12:28:38.027',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('50e8f0dc-c21c-41e6-b7f5-503592969278','a7c7c0df-60c6-4a73-88d0-92b2fa521655','counsellor-skill','Germany Admissions',5,1,'{}','2026-08-11 12:28:38.022','2026-08-11 12:28:38.022',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('515032cf-dda9-4fea-a926-293ae1efc31e','a7c7c0df-60c6-4a73-88d0-92b2fa521655','intake','Mar-2027',8,1,'{}','2026-08-11 12:28:38.295','2026-08-11 12:28:38.295',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('52342b47-487f-4e37-9b2b-06bf666d38f2','a7c7c0df-60c6-4a73-88d0-92b2fa521655','visa-type','Student Visa (Australia)',3,1,'{}','2026-08-11 12:28:38.582','2026-08-11 12:28:38.582',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('533340c1-7060-4ad5-90e5-9c9d91bb08b1','a7c7c0df-60c6-4a73-88d0-92b2fa521655','payment-mode','Paytm',9,1,'{}','2026-08-11 12:28:38.775','2026-08-11 12:28:38.775',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('55991569-8e94-41aa-bc41-2b313344371c','a7c7c0df-60c6-4a73-88d0-92b2fa521655','university','University of Melbourne',9,1,'{}','2026-08-11 12:28:38.158','2026-08-11 12:28:38.158',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('56ad0bd9-602e-4bd1-8ca5-2bf6da7249d0','a7c7c0df-60c6-4a73-88d0-92b2fa521655','course','Automobile Engineering',9,1,'{}','2026-08-11 12:28:38.220','2026-08-11 12:28:38.220',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('5afe27b4-d4b9-4ad6-ba54-4937605ea1aa','a7c7c0df-60c6-4a73-88d0-92b2fa521655','embassy','US Consulate – Mumbai',6,1,'{}','2026-08-11 12:28:38.688','2026-08-11 12:28:38.688',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('5b939f43-7765-40fe-8517-ca42af98f1ac','a7c7c0df-60c6-4a73-88d0-92b2fa521655','qualification','Bachelor\'s Degree',4,1,'{}','2026-08-11 12:28:38.407','2026-08-11 12:28:38.407',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('5bcc2904-cd47-4578-b922-1015dd77541f','a7c7c0df-60c6-4a73-88d0-92b2fa521655','payment-mode','Credit Card',5,1,'{}','2026-08-11 12:28:38.761','2026-08-11 12:28:38.761',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('5cb79594-3ac1-4c8e-9ee3-a5418753e6a0','a7c7c0df-60c6-4a73-88d0-92b2fa521655','source','Instagram',6,1,'{}','2026-08-11 12:28:38.915','2026-08-11 12:28:38.915',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('5d5f0999-7d9d-4d2c-b196-536a21052c5c','a7c7c0df-60c6-4a73-88d0-92b2fa521655','country','Canada',1,1,'{}','2026-08-11 12:28:38.079','2026-08-11 12:28:38.079',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('60d2d530-84a2-4be8-91e6-5db30663bf29','a7c7c0df-60c6-4a73-88d0-92b2fa521655','source','Partner',8,1,'{}','2026-08-11 12:28:38.923','2026-08-11 12:28:38.923',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('62412dc9-4497-40f2-8e50-ce22c57a49fb','a7c7c0df-60c6-4a73-88d0-92b2fa521655','applyLevel','Certificate',1,1,'{}','2026-08-11 12:28:38.496','2026-08-11 12:28:38.496',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('62fdaf97-c783-4026-857c-0bba97b4baf3','a7c7c0df-60c6-4a73-88d0-92b2fa521655','payment-mode','Cheque',4,1,'{}','2026-08-11 12:28:38.757','2026-08-11 12:28:38.757',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('637caf20-3222-40c8-8e4d-3e5e341defaf','a7c7c0df-60c6-4a73-88d0-92b2fa521655','lead-source','WhatsApp',9,1,'{}','2026-08-11 12:28:38.882','2026-08-11 12:28:38.882',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('652091fe-2b08-40b8-a1e5-a67a1c6b556e','a7c7c0df-60c6-4a73-88d0-92b2fa521655','university','Coventry University',8,1,'{}','2026-08-11 12:28:38.154','2026-08-11 12:28:38.154',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('65ecf045-46ca-402e-aa3b-8dcb570b0a64','a7c7c0df-60c6-4a73-88d0-92b2fa521655','maritalStatus','Single',1,1,'{}','2026-08-11 12:28:39.131','2026-08-11 12:28:39.131',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('67a0746c-29e1-4695-9427-d8429643151e','a7c7c0df-60c6-4a73-88d0-92b2fa521655','department','Counselling',1,1,'{}','2026-08-11 12:28:38.046','2026-08-11 12:28:38.046',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('68b915d4-819d-4969-b559-74075b3ee85e','a7c7c0df-60c6-4a73-88d0-92b2fa521655','intake','Apr-2028',21,1,'{}','2026-08-11 12:28:38.353','2026-08-11 12:28:38.353',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('68bbac9b-a37a-43db-ae11-44b1fc75eee1','a7c7c0df-60c6-4a73-88d0-92b2fa521655','fee-type','Tuition Fee Installment',8,1,'{}','2026-08-11 12:28:38.733','2026-08-11 12:28:38.733',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('6ab4db0f-e346-4a54-acc5-2aabfbaa6be8','a7c7c0df-60c6-4a73-88d0-92b2fa521655','currency','CAD',3,1,'{}','2026-08-11 12:28:38.787','2026-08-11 12:28:38.787',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('6ac1b717-4096-4773-8301-1ab7abfd98f5','a7c7c0df-60c6-4a73-88d0-92b2fa521655','visa-type','Study Permit (Canada)',1,1,'{}','2026-08-11 12:28:38.568','2026-08-11 12:28:38.568',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('6c4f596c-57b2-4453-848d-2201f952013a','a7c7c0df-60c6-4a73-88d0-92b2fa521655','highestQual','10th',1,1,'{}','2026-08-11 12:28:38.455','2026-08-11 12:28:38.455',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('6d5cae98-5d7a-4841-ac49-14158b4d5772','a7c7c0df-60c6-4a73-88d0-92b2fa521655','country','United States',4,1,'{}','2026-08-11 12:28:38.093','2026-08-11 12:28:38.093',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('6df0f6f9-cbfc-43a3-949e-65df916388cc','a7c7c0df-60c6-4a73-88d0-92b2fa521655','payment-mode','Razorpay',8,1,'{}','2026-08-11 12:28:38.772','2026-08-11 12:28:38.772',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('6e5059e8-ebb6-4985-a75b-f86bd6df2414','a7c7c0df-60c6-4a73-88d0-92b2fa521655','visa-type','Tourist Visa',9,1,'{}','2026-08-11 12:28:38.606','2026-08-11 12:28:38.606',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('6eacb473-bf91-47d8-8d30-6b737c1a0fe1','a7c7c0df-60c6-4a73-88d0-92b2fa521655','visa-type','F-1 Student Visa (USA)',4,1,'{}','2026-08-11 12:28:38.586','2026-08-11 12:28:38.586',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('71737c03-7239-44f1-8582-30e713dabb9c','a7c7c0df-60c6-4a73-88d0-92b2fa521655','applyLevel','Diploma',2,1,'{}','2026-08-11 12:28:38.501','2026-08-11 12:28:38.501',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('7246afb8-3e6d-4e1f-a131-92f09de7da3a','a7c7c0df-60c6-4a73-88d0-92b2fa521655','highestQual','Masters',5,1,'{}','2026-08-11 12:28:38.484','2026-08-11 12:28:38.484',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('72a758e2-9f2f-4a9f-b171-5aeaa2415830','a7c7c0df-60c6-4a73-88d0-92b2fa521655','currency','NZD',7,1,'{}','2026-08-11 12:28:38.807','2026-08-11 12:28:38.807',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('72b3af1b-1821-4e3e-9df5-0b0fb4f70de5','a7c7c0df-60c6-4a73-88d0-92b2fa521655','visit-purpose','Existing Student Support',7,1,'{}','2026-07-04 06:46:05.274','2026-07-04 06:46:05.274',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('72cd6c3a-24a8-41e7-8b3b-37880f4c1f40','a7c7c0df-60c6-4a73-88d0-92b2fa521655','university','Stanford University',13,1,'{}','2026-08-11 12:28:38.175','2026-08-11 12:28:38.175',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('7348dade-2876-470e-ab18-983d5c40947b','a7c7c0df-60c6-4a73-88d0-92b2fa521655','testName','TOEFL',2,1,'{}','2026-08-11 12:28:39.204','2026-08-11 12:28:39.204',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('7353b714-46a5-4f1c-ae09-f3532d8ec54b','a7c7c0df-60c6-4a73-88d0-92b2fa521655','document-checklist','Academic Transcripts',2,1,'{}','2026-08-11 12:28:38.618','2026-08-11 12:28:38.618',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('7383e157-9df9-4fca-920f-6847526ef40d','a7c7c0df-60c6-4a73-88d0-92b2fa521655','document-checklist','CAS / I-20',11,1,'{}','2026-08-11 12:28:38.653','2026-08-11 12:28:38.653',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('7653561a-ae08-44c8-9c98-5de37917d87c','a7c7c0df-60c6-4a73-88d0-92b2fa521655','embassy','New Zealand Consulate – Mumbai',8,1,'{}','2026-08-11 12:28:38.697','2026-08-11 12:28:38.697',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('799eec82-2a2d-4ed0-9336-d292ba81826f','a7c7c0df-60c6-4a73-88d0-92b2fa521655','communication-template','Thank You After Visit',8,1,'{}','2026-08-11 12:28:39.268','2026-08-11 12:28:39.268',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('7e68fc33-1637-4e04-8b3e-8598beb7e658','a7c7c0df-60c6-4a73-88d0-92b2fa521655','highestQual','Bachelors',4,1,'{}','2026-08-11 12:28:38.474','2026-08-11 12:28:38.474',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('7ee33d2d-1dd5-40eb-9abb-f67d489c4b7f','a7c7c0df-60c6-4a73-88d0-92b2fa521655','university','University of Birmingham',7,1,'{}','2026-08-11 12:28:38.149','2026-08-11 12:28:38.149',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('7eebd28d-7909-415a-b55e-eb4b4aa2f56f','a7c7c0df-60c6-4a73-88d0-92b2fa521655','intake','Dec-2026',5,1,'{}','2026-08-11 12:28:38.279','2026-08-11 12:28:38.279',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('808a2a04-8414-417c-96d4-182b02e345dd','a7c7c0df-60c6-4a73-88d0-92b2fa521655','course','Civil Engineering',10,1,'{}','2026-08-11 12:28:38.223','2026-08-11 12:28:38.223',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('81f73b3b-9ee8-4df2-904b-0cdc44f9bf2d','a7c7c0df-60c6-4a73-88d0-92b2fa521655','intake','Nov-2026',4,1,'{}','2026-08-11 12:28:38.274','2026-08-11 12:28:38.274',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('8356d856-910d-424d-bb7f-c9a5c70acc52','a7c7c0df-60c6-4a73-88d0-92b2fa521655','country','Dubai (UAE)',9,1,'{}','2026-08-11 12:28:38.116','2026-08-11 12:28:38.116',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('83d119fd-0d6f-4d1e-b5be-0312712ef78b','a7c7c0df-60c6-4a73-88d0-92b2fa521655','document-checklist','Medical Report',12,1,'{}','2026-08-11 12:28:38.656','2026-08-11 12:28:38.656',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('841b5df8-5cc2-4cf1-b0eb-0443d9ec13eb','a7c7c0df-60c6-4a73-88d0-92b2fa521655','payment-mode','Bank Transfer',7,1,'{}','2026-08-11 12:28:38.768','2026-08-11 12:28:38.768',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('84bbcf3b-f49b-402f-8b6e-0cbce1f7a053','a7c7c0df-60c6-4a73-88d0-92b2fa521655','qualification','12th Standard',2,1,'{}','2026-08-11 12:28:38.380','2026-08-11 12:28:38.380',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('863a6043-234d-477c-9a4e-ab038f2fead7','a7c7c0df-60c6-4a73-88d0-92b2fa521655','tags','Repeat Visit',9,1,'{}','2026-08-11 12:28:38.998','2026-08-11 12:28:38.998',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('86cc301f-382a-4d79-9289-63c7d511c164','a7c7c0df-60c6-4a73-88d0-92b2fa521655','country','United Kingdom',2,1,'{}','2026-08-11 12:28:38.083','2026-08-11 12:28:38.083',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('88a3bcd8-8c53-484c-ad82-6badc836383b','a7c7c0df-60c6-4a73-88d0-92b2fa521655','lead-source','Walk-in',2,1,'{}','2026-08-11 12:28:38.850','2026-08-11 12:28:38.850',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('88e3e580-3e6c-424f-a991-f3801ea6d598','a7c7c0df-60c6-4a73-88d0-92b2fa521655','countryCode','+44 UK',3,1,'{}','2026-08-11 12:28:39.164','2026-08-11 12:28:39.164',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('89079488-5cc5-432c-b047-2bca2f21a421','a7c7c0df-60c6-4a73-88d0-92b2fa521655','lead-source','Referral',3,1,'{}','2026-08-11 12:28:38.854','2026-08-11 12:28:38.854',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('899ab211-9dc5-46cb-8c03-ab88a16983eb','a7c7c0df-60c6-4a73-88d0-92b2fa521655','countryCode','+49 Germany',7,1,'{}','2026-08-11 12:28:39.185','2026-08-11 12:28:39.185',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('89d685c0-5d4a-40a0-91d1-f262090731d8','a7c7c0df-60c6-4a73-88d0-92b2fa521655','department','Accounts',4,1,'{}','2026-08-11 12:28:38.058','2026-08-11 12:28:38.058',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('8a2856ae-518c-46e2-b70e-8cb8551100f0','a7c7c0df-60c6-4a73-88d0-92b2fa521655','maritalStatus','Widowed',4,1,'{}','2026-08-11 12:28:39.144','2026-08-11 12:28:39.144',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('8b80a235-eec8-498b-8c18-127ad56c2ce2','a7c7c0df-60c6-4a73-88d0-92b2fa521655','visa-type','Stamp 2 (Ireland)',7,1,'{}','2026-08-11 12:28:38.598','2026-08-11 12:28:38.598',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('8c2a0be5-76c5-4b2c-ab30-1a6a6273d90a','a7c7c0df-60c6-4a73-88d0-92b2fa521655','gender','Male',1,1,'{}','2026-08-11 12:28:39.086','2026-08-11 12:28:39.086',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('8cecc87e-a33c-4834-8ae7-5ebf74bac4e9','a7c7c0df-60c6-4a73-88d0-92b2fa521655','source','Facebook Ads',4,1,'{}','2026-08-11 12:28:38.907','2026-08-11 12:28:38.907',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('8e85569c-13ea-49fa-a5be-e0940f1a46d0','a7c7c0df-60c6-4a73-88d0-92b2fa521655','country','France',8,1,'{}','2026-08-11 12:28:38.112','2026-08-11 12:28:38.112',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('8f6a88ba-7037-4638-b4eb-390d83db5e47','a7c7c0df-60c6-4a73-88d0-92b2fa521655','tax','Zero Rated',5,1,'{}','2026-08-11 12:28:38.840','2026-08-11 12:28:38.840',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('9038c8db-ce24-4c2e-b45c-095a7213a186','a7c7c0df-60c6-4a73-88d0-92b2fa521655','department','Marketing',6,1,'{}','2026-08-11 12:28:38.067','2026-08-11 12:28:38.067',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('905698af-fee5-4ba0-bfb6-91b7915eea1f','a7c7c0df-60c6-4a73-88d0-92b2fa521655','nationality','India',1,1,'{}','2026-08-11 12:28:39.103','2026-08-11 12:28:39.103',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('90f7bbac-2445-4aa5-860a-e25eb55195b7','a7c7c0df-60c6-4a73-88d0-92b2fa521655','tags','Cold Lead',3,1,'{}','2026-08-11 12:28:38.974','2026-08-11 12:28:38.974',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('91e9042f-04d3-4908-8e00-ca2cf49966f6','a7c7c0df-60c6-4a73-88d0-92b2fa521655','document-checklist','LOR (Letter of Recommendation)',6,1,'{}','2026-08-11 12:28:38.634','2026-08-11 12:28:38.634',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('935bc7e4-37a2-4d3e-860e-0344eae30e98','a7c7c0df-60c6-4a73-88d0-92b2fa521655','fee-type','Refund Adjustment',10,1,'{}','2026-08-11 12:28:38.740','2026-08-11 12:28:38.740',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('957ee6b8-4ef6-4c3c-a544-6acd59b227e5','a7c7c0df-60c6-4a73-88d0-92b2fa521655','document-checklist','Degree Certificate',3,1,'{}','2026-08-11 12:28:38.621','2026-08-11 12:28:38.621',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('97985511-d796-4fa3-b894-33b79baf0ddc','a7c7c0df-60c6-4a73-88d0-92b2fa521655','countryCode','+61 Australia',4,1,'{}','2026-08-11 12:28:39.169','2026-08-11 12:28:39.169',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('980bd786-5b05-4883-8605-5cacea12c4cd','a7c7c0df-60c6-4a73-88d0-92b2fa521655','university','University of Sydney',11,1,'{}','2026-08-11 12:28:38.167','2026-08-11 12:28:38.167',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('986c5c2f-1fa2-4a91-8b7c-f3b8c338a093','a7c7c0df-60c6-4a73-88d0-92b2fa521655','country','Germany',5,1,'{}','2026-08-11 12:28:38.099','2026-08-11 12:28:38.099',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('988d1050-10c5-4295-9f82-5e00ce5c3cd9','a7c7c0df-60c6-4a73-88d0-92b2fa521655','university','University College Dublin',15,1,'{}','2026-08-11 12:28:38.184','2026-08-11 12:28:38.184',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('9b2d7151-55d8-4af1-a7ab-c52513e8e96c','a7c7c0df-60c6-4a73-88d0-92b2fa521655','tags','Budget Concern',5,1,'{}','2026-08-11 12:28:38.982','2026-08-11 12:28:38.982',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('9bdd74dd-ceb7-4253-a791-726a99b69ac3','a7c7c0df-60c6-4a73-88d0-92b2fa521655','embassy','Australian High Commission – New Delhi',5,1,'{}','2026-08-11 12:28:38.684','2026-08-11 12:28:38.684',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('9d0a33a4-d923-4e7d-8927-1dbf274e95bc','a7c7c0df-60c6-4a73-88d0-92b2fa521655','gender','Other',3,1,'{}','2026-08-11 12:28:39.094','2026-08-11 12:28:39.094',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('9d2ed4d8-a6d6-402b-8fe7-fcc777a259e6','a7c7c0df-60c6-4a73-88d0-92b2fa521655','embassy','VFS Global – Mumbai (Canada)',2,1,'{}','2026-08-11 12:28:38.673','2026-08-11 12:28:38.673',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('9f096b7b-4145-43a9-b0b6-3db504bae18e','a7c7c0df-60c6-4a73-88d0-92b2fa521655','document-checklist','SOP (Statement of Purpose)',5,1,'{}','2026-08-11 12:28:38.630','2026-08-11 12:28:38.630',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('a4a75b34-3504-49be-aee5-5da9790f9140','a7c7c0df-60c6-4a73-88d0-92b2fa521655','countryCode','+64 New Zealand',5,1,'{}','2026-08-11 12:28:39.173','2026-08-11 12:28:39.173',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('a4f493a9-b3af-49d7-b689-fc42e7dd9a31','a7c7c0df-60c6-4a73-88d0-92b2fa521655','visa-type','Work Permit',10,1,'{}','2026-08-11 12:28:38.610','2026-08-11 12:28:38.610',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('a550b442-931e-4ac1-a830-0c432aeac5fe','a7c7c0df-60c6-4a73-88d0-92b2fa521655','department','Visa',3,1,'{}','2026-08-11 12:28:38.054','2026-08-11 12:28:38.054',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('a58fb69e-afa5-47b2-bdeb-c8bcbc6f4fac','a7c7c0df-60c6-4a73-88d0-92b2fa521655','intake','Jan-2028',18,1,'{}','2026-08-11 12:28:38.340','2026-08-11 12:28:38.340',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('a5c9a507-1055-4abe-9436-7042281046a4','a7c7c0df-60c6-4a73-88d0-92b2fa521655','visa-type','Student Visa (UK)',2,1,'{}','2026-08-11 12:28:38.577','2026-08-11 12:28:38.577',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('a5ea9cf9-0706-49f5-9da4-44eae5cefafe','a7c7c0df-60c6-4a73-88d0-92b2fa521655','payment-mode','Debit Card',6,1,'{}','2026-08-11 12:28:38.765','2026-08-11 12:28:38.765',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('a7ec3e0f-2c25-4d53-a104-2004044330ae','a7c7c0df-60c6-4a73-88d0-92b2fa521655','currency','INR',1,1,'{}','2026-08-11 12:28:38.780','2026-08-11 12:28:38.780',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('a818036b-65a6-4e88-9c31-951d5fc9a814','a7c7c0df-60c6-4a73-88d0-92b2fa521655','intake','Sep-2026',2,1,'{}','2026-08-11 12:28:38.266','2026-08-11 12:28:38.266',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('a8a2ea30-4be4-4c52-8438-9273e0798a6d','a7c7c0df-60c6-4a73-88d0-92b2fa521655','university','Harvard University',12,1,'{}','2026-08-11 12:28:38.171','2026-08-11 12:28:38.171',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('a939d39e-45a5-4377-a7a7-d4f440b9cde1','a7c7c0df-60c6-4a73-88d0-92b2fa521655','source','Walk-in',2,1,'{}','2026-08-11 12:28:38.901','2026-08-11 12:28:38.901',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('ac148158-69fc-416f-b2e0-6225d691b766','a7c7c0df-60c6-4a73-88d0-92b2fa521655','nationality','Other',6,1,'{}','2026-08-11 12:28:39.127','2026-08-11 12:28:39.127',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('adae0234-51ad-4002-a52b-9ce916e8bce1','a7c7c0df-60c6-4a73-88d0-92b2fa521655','fee-type','Documentation Fee',4,1,'{}','2026-08-11 12:28:38.717','2026-08-11 12:28:38.717',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('af0f4ed4-27c4-4799-982e-2f6ce60414fe','a7c7c0df-60c6-4a73-88d0-92b2fa521655','enquiry-status','QUALIFIED',4,1,'{}','2026-08-11 12:28:38.945','2026-08-11 12:28:38.945',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('b05951df-93f8-4cb4-9de1-e06028c1a7b8','a7c7c0df-60c6-4a73-88d0-92b2fa521655','lead-source','Facebook Ads',4,1,'{}','2026-08-11 12:28:38.858','2026-08-11 12:28:38.858',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('b12197a1-771f-49be-95d1-de652f6fcc1a','a7c7c0df-60c6-4a73-88d0-92b2fa521655','department','Reception',5,1,'{}','2026-08-11 12:28:38.063','2026-08-11 12:28:38.063',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('b187cb6a-928f-4549-9695-2b6ec56c0a81','a7c7c0df-60c6-4a73-88d0-92b2fa521655','lead-source','LinkedIn',12,1,'{}','2026-08-11 12:28:38.893','2026-08-11 12:28:38.893',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('b22964a0-e843-4a9d-9f27-d0669b77f2c6','a7c7c0df-60c6-4a73-88d0-92b2fa521655','communication-template','Follow-up Reminder',2,1,'{}','2026-08-11 12:28:39.236','2026-08-11 12:28:39.236',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('b2438b9d-5f2f-45b3-bfaa-946912a52dc1','a7c7c0df-60c6-4a73-88d0-92b2fa521655','nationality','UAE',5,1,'{}','2026-08-11 12:28:39.121','2026-08-11 12:28:39.121',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('b331e6e3-8413-4e33-a227-98286eaa41f1','a7c7c0df-60c6-4a73-88d0-92b2fa521655','intake','Nov-2027',16,1,'{}','2026-08-11 12:28:38.333','2026-08-11 12:28:38.333',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('b36584ca-7369-400c-a38f-d083debdc58e','a7c7c0df-60c6-4a73-88d0-92b2fa521655','document-checklist','Police Clearance',13,1,'{}','2026-08-11 12:28:38.661','2026-08-11 12:28:38.661',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('b44a2b42-22f7-4174-b12a-7a8553cd9710','a7c7c0df-60c6-4a73-88d0-92b2fa521655','lead-source','Education Fair',7,1,'{}','2026-08-11 12:28:38.873','2026-08-11 12:28:38.873',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('b4ad0810-3e9f-46dc-a587-abfd4f0a357e','a7c7c0df-60c6-4a73-88d0-92b2fa521655','intake','Dec-2027',17,1,'{}','2026-08-11 12:28:38.336','2026-08-11 12:28:38.336',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('b57301e4-cb17-45a5-be2b-a46273fa913e','a7c7c0df-60c6-4a73-88d0-92b2fa521655','intake','Mar-2028',20,1,'{}','2026-08-11 12:28:38.349','2026-08-11 12:28:38.349',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('b5954b56-c664-4253-bd44-26c5db8aa058','a7c7c0df-60c6-4a73-88d0-92b2fa521655','lead-source','Website',1,1,'{}','2026-08-11 12:28:38.845','2026-08-11 12:28:38.845',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('b601efe1-6c92-4fea-a50a-99f15beb0b13','a7c7c0df-60c6-4a73-88d0-92b2fa521655','intake','May-2027',10,1,'{}','2026-08-11 12:28:38.304','2026-08-11 12:28:38.304',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('b77a3216-2a5c-42a3-9bdc-e121809b74f9','a7c7c0df-60c6-4a73-88d0-92b2fa521655','course','Mechanical Engineering',8,1,'{}','2026-08-11 12:28:38.216','2026-08-11 12:28:38.216',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('b95d62ae-9b2e-450d-a2d1-31f828ef97a6','a7c7c0df-60c6-4a73-88d0-92b2fa521655','countryCode','+91 India',1,1,'{}','2026-08-11 12:28:39.148','2026-08-11 12:28:39.148',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('b968067b-e897-4882-8bb7-0674e0fdf8a9','a7c7c0df-60c6-4a73-88d0-92b2fa521655','country','New Zealand',6,1,'{}','2026-08-11 12:28:38.103','2026-08-11 12:28:38.103',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('b9f983d4-3b20-40ee-866a-1d78c8108e79','a7c7c0df-60c6-4a73-88d0-92b2fa521655','intake','Oct-2027',15,1,'{}','2026-08-11 12:28:38.329','2026-08-11 12:28:38.329',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('ba1ce3f0-2ca4-4089-a0fd-531ffb756d34','a7c7c0df-60c6-4a73-88d0-92b2fa521655','visit-purpose','Other',8,1,'{}','2026-07-04 06:46:05.279','2026-07-04 06:46:05.279',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('baf7a602-a62d-4bda-871c-f0b231b1b746','a7c7c0df-60c6-4a73-88d0-92b2fa521655','intake','Jul-2028',24,1,'{}','2026-08-11 12:28:38.370','2026-08-11 12:28:38.370',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('bdbc7e17-fdab-468d-a813-ab4a169ecd70','a7c7c0df-60c6-4a73-88d0-92b2fa521655','course','Hotel Management',11,1,'{}','2026-08-11 12:28:38.227','2026-08-11 12:28:38.227',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('be70f15a-b7dc-4d22-b59b-46f02b89a1d7','a7c7c0df-60c6-4a73-88d0-92b2fa521655','course','MSc Computer Science',4,1,'{}','2026-08-11 12:28:38.199','2026-08-11 12:28:38.199',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('c001c218-b4d3-468d-8606-fb12b27db63d','a7c7c0df-60c6-4a73-88d0-92b2fa521655','highestQual','12th',2,1,'{}','2026-08-11 12:28:38.460','2026-08-11 12:28:38.460',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('c0048361-990c-48a5-99ba-64f68fd52ff8','a7c7c0df-60c6-4a73-88d0-92b2fa521655','document-checklist','Passport Photos',14,1,'{}','2026-08-11 12:28:38.666','2026-08-11 12:28:38.666',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('c033c263-9f8b-4fef-bfa9-521c5edc4ee4','a7c7c0df-60c6-4a73-88d0-92b2fa521655','counsellor-skill','Canada Admissions',1,1,'{}','2026-08-11 12:28:37.997','2026-08-11 12:28:37.997',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('c11166d7-76f0-4923-9162-2434e8267dd8','a7c7c0df-60c6-4a73-88d0-92b2fa521655','payment-mode','NEFT / IMPS',3,1,'{}','2026-08-11 12:28:38.753','2026-08-11 12:28:38.753',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('c1160855-4547-43a6-9744-8fd70ecbd1ea','a7c7c0df-60c6-4a73-88d0-92b2fa521655','visit-purpose','Follow-up Visit',5,1,'{}','2026-07-04 06:46:05.267','2026-07-04 06:46:05.267',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('c1ce1107-393b-47c6-bd74-38321a65138c','a7c7c0df-60c6-4a73-88d0-92b2fa521655','visa-type','Dependent Visa',8,1,'{}','2026-08-11 12:28:38.602','2026-08-11 12:28:38.602',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('c37d778d-76c3-48e9-bb3f-3d15404e46a1','a7c7c0df-60c6-4a73-88d0-92b2fa521655','communication-template','Document Pending Alert',4,1,'{}','2026-08-11 12:28:39.245','2026-08-11 12:28:39.245',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('c5250310-c10d-485f-9495-3046fd72c715','a7c7c0df-60c6-4a73-88d0-92b2fa521655','testName','GMAT',6,1,'{}','2026-08-11 12:28:39.222','2026-08-11 12:28:39.222',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('c5ff2db4-1b2c-4d01-b49c-b75a95e4a292','a7c7c0df-60c6-4a73-88d0-92b2fa521655','intake','Aug-2027',13,1,'{}','2026-08-11 12:28:38.317','2026-08-11 12:28:38.317',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('c68b758c-6c1f-457b-93fb-eccdc6c0268f','a7c7c0df-60c6-4a73-88d0-92b2fa521655','communication-template','Fee Due Reminder',7,1,'{}','2026-08-11 12:28:39.264','2026-08-11 12:28:39.264',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('c784c1e4-6952-439d-a112-d223ceee0e2a','a7c7c0df-60c6-4a73-88d0-92b2fa521655','fee-type','Application Fee',2,1,'{}','2026-08-11 12:28:38.709','2026-08-11 12:28:38.709',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('c8596614-20bb-4454-b65b-b305931d4a79','a7c7c0df-60c6-4a73-88d0-92b2fa521655','course','Public Health',13,1,'{}','2026-08-11 12:28:38.236','2026-08-11 12:28:38.236',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('caa68fb9-5549-413c-80de-4be9f4ca1f6c','a7c7c0df-60c6-4a73-88d0-92b2fa521655','currency','USD',2,1,'{}','2026-08-11 12:28:38.784','2026-08-11 12:28:38.784',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('cea82d4d-5831-4fbb-be42-17e67a715f12','a7c7c0df-60c6-4a73-88d0-92b2fa521655','visa-type','National Visa D (Germany)',5,1,'{}','2026-08-11 12:28:38.590','2026-08-11 12:28:38.590',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('ceb89f35-86cc-4bbf-86c0-e8f8a7c8746e','a7c7c0df-60c6-4a73-88d0-92b2fa521655','tags','Warm Lead',2,1,'{}','2026-08-11 12:28:38.971','2026-08-11 12:28:38.971',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('cf3a852e-bdf4-451e-b98a-7e640efb1553','a7c7c0df-60c6-4a73-88d0-92b2fa521655','communication-template','Visa Appointment Reminder',6,1,'{}','2026-08-11 12:28:39.259','2026-08-11 12:28:39.259',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('cf912802-7b7c-4670-ab33-25a59c50da73','a7c7c0df-60c6-4a73-88d0-92b2fa521655','document-checklist','Bank Statement',8,1,'{}','2026-08-11 12:28:38.641','2026-08-11 12:28:38.641',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('cf9a35f9-dda4-4496-ba7d-569a69b85814','a7c7c0df-60c6-4a73-88d0-92b2fa521655','source','WhatsApp',9,1,'{}','2026-08-11 12:28:38.927','2026-08-11 12:28:38.927',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('cfdb2a7f-3166-4317-88f7-73242bbc0aa7','a7c7c0df-60c6-4a73-88d0-92b2fa521655','currency','GBP',4,1,'{}','2026-08-11 12:28:38.792','2026-08-11 12:28:38.792',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('d07d68b7-455c-4d05-9f27-656874bea864','a7c7c0df-60c6-4a73-88d0-92b2fa521655','countryCode','+1 USA / Canada',2,1,'{}','2026-08-11 12:28:39.158','2026-08-11 12:28:39.158',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('d12d580e-8e07-4d7d-a3aa-4fc889254576','a7c7c0df-60c6-4a73-88d0-92b2fa521655','lead-source','Justdial',11,1,'{}','2026-08-11 12:28:38.890','2026-08-11 12:28:38.890',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('d373b9ce-1320-4b95-8a0a-d6ab889c6cae','a7c7c0df-60c6-4a73-88d0-92b2fa521655','communication-template','Demo Invitation',3,1,'{}','2026-08-11 12:28:39.240','2026-08-11 12:28:39.240',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('d3d3bb68-d631-462f-94a6-7863bd5aa199','a7c7c0df-60c6-4a73-88d0-92b2fa521655','communication-template','Welcome SMS',1,1,'{}','2026-08-11 12:28:39.232','2026-08-11 12:28:39.232',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('d4575f6a-b35a-4ca5-afd8-f04d1945fcf1','a7c7c0df-60c6-4a73-88d0-92b2fa521655','testName','Duolingo English Test',4,1,'{}','2026-08-11 12:28:39.212','2026-08-11 12:28:39.212',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('d46f3938-38de-44bc-837b-ca81344accac','a7c7c0df-60c6-4a73-88d0-92b2fa521655','counsellor-skill','USA Admissions',4,1,'{}','2026-08-11 12:28:38.017','2026-08-11 12:28:38.017',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('d4b33057-8830-4d34-bcd3-38b2410518af','a7c7c0df-60c6-4a73-88d0-92b2fa521655','nationality','Sri Lanka',4,1,'{}','2026-08-11 12:28:39.117','2026-08-11 12:28:39.117',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('d940a6ab-ebd8-4f08-bdc6-64aea661bc32','a7c7c0df-60c6-4a73-88d0-92b2fa521655','qualification','Master\'s Degree',5,1,'{}','2026-08-11 12:28:38.412','2026-08-11 12:28:38.412',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('da927b6d-2fa9-4e33-958b-a098641ac041','a7c7c0df-60c6-4a73-88d0-92b2fa521655','fee-type','Late Fee',9,1,'{}','2026-08-11 12:28:38.736','2026-08-11 12:28:38.736',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('daea238f-cdfe-4bc8-9716-8832777e8903','a7c7c0df-60c6-4a73-88d0-92b2fa521655','country','Singapore',10,1,'{}','2026-08-11 12:28:38.120','2026-08-11 12:28:38.120',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('dc6ed819-18f0-4088-8913-48dcc583fbfd','a7c7c0df-60c6-4a73-88d0-92b2fa521655','enquiry-status','ON_HOLD',9,1,'{}','2026-08-11 12:28:38.964','2026-08-11 12:28:38.964',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('dcd6a504-b97d-4800-85c4-057a449863f9','a7c7c0df-60c6-4a73-88d0-92b2fa521655','lead-source','Google Ads',5,1,'{}','2026-08-11 12:28:38.863','2026-08-11 12:28:38.863',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('e00c2744-6a70-4bdb-8305-6016730bdfec','a7c7c0df-60c6-4a73-88d0-92b2fa521655','lead-source','Partner / Agent',8,1,'{}','2026-08-11 12:28:38.878','2026-08-11 12:28:38.878',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('e1775a0a-9e7e-41cc-969c-d42842a20675','a7c7c0df-60c6-4a73-88d0-92b2fa521655','country','Australia',3,1,'{}','2026-08-11 12:28:38.087','2026-08-11 12:28:38.087',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('e3f4ee2f-a1b0-4be2-b88b-099c2f137b91','a7c7c0df-60c6-4a73-88d0-92b2fa521655','department','Operations',7,1,'{}','2026-08-11 12:28:38.070','2026-08-11 12:28:38.070',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('e43f1269-5106-43f5-bc8d-77ac60a5c1de','a7c7c0df-60c6-4a73-88d0-92b2fa521655','countryCode','+353 Ireland',8,1,'{}','2026-08-11 12:28:39.194','2026-08-11 12:28:39.194',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('e492ce3b-3c46-463f-a02d-ed611905d586','a7c7c0df-60c6-4a73-88d0-92b2fa521655','course','Foundation Program',18,1,'{}','2026-08-11 12:28:38.258','2026-08-11 12:28:38.258',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('e4b77a97-8fd2-45ea-8047-46e8ac796ef2','a7c7c0df-60c6-4a73-88d0-92b2fa521655','visit-purpose','Study Abroad Enquiry',1,1,'{}','2026-07-04 06:46:05.247','2026-07-04 06:46:05.247',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('e4c7625d-04ef-4e01-a16b-5c94f0b057af','a7c7c0df-60c6-4a73-88d0-92b2fa521655','testName','SAT',7,1,'{}','2026-08-11 12:28:39.228','2026-08-11 12:28:39.228',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('e5f19eee-2358-473d-a932-6d7c4e41544f','a7c7c0df-60c6-4a73-88d0-92b2fa521655','currency','AUD',5,1,'{}','2026-08-11 12:28:38.797','2026-08-11 12:28:38.797',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('e6e57480-94c7-434b-b6d8-02458d28bc86','a7c7c0df-60c6-4a73-88d0-92b2fa521655','enquiry-status','FOLLOW_UP',6,1,'{}','2026-08-11 12:28:38.952','2026-08-11 12:28:38.952',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('e746bccf-f6cf-49b0-b126-ce7f8b498589','a7c7c0df-60c6-4a73-88d0-92b2fa521655','tags','Needs IELTS',7,1,'{}','2026-08-11 12:28:38.990','2026-08-11 12:28:38.990',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('e7e34117-b355-4f91-bfd3-6fcb8e0ac7b0','a7c7c0df-60c6-4a73-88d0-92b2fa521655','fee-type','IELTS Coaching Fee',5,1,'{}','2026-08-11 12:28:38.720','2026-08-11 12:28:38.720',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('e9c11937-8049-47a6-bc0d-e4ab8c4abe29','a7c7c0df-60c6-4a73-88d0-92b2fa521655','applyLevel','Masters',4,1,'{}','2026-08-11 12:28:38.524','2026-08-11 12:28:38.524',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('ea15118a-81d9-411a-9def-36ee8698d0ff','a7c7c0df-60c6-4a73-88d0-92b2fa521655','course','Information Technology',7,1,'{}','2026-08-11 12:28:38.212','2026-08-11 12:28:38.212',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('ea608e06-e6a5-4094-a542-1db0476e1e56','a7c7c0df-60c6-4a73-88d0-92b2fa521655','counsellor-skill','Australia Admissions',3,1,'{}','2026-08-11 12:28:38.012','2026-08-11 12:28:38.012',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('ee5359d8-0410-4e9a-9f07-9c9e43a086d5','a7c7c0df-60c6-4a73-88d0-92b2fa521655','counsellor-skill','Student Care',9,1,'{}','2026-08-11 12:28:38.040','2026-08-11 12:28:38.040',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('effc2cc5-bb5f-40d5-a3e4-adedf5f4cddb','a7c7c0df-60c6-4a73-88d0-92b2fa521655','highestQual','PhD',6,1,'{}','2026-08-11 12:28:38.491','2026-08-11 12:28:38.491',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('f0d8d072-8a48-46d4-a9a7-12a5bd69bebd','a7c7c0df-60c6-4a73-88d0-92b2fa521655','course','MS Data Science',5,1,'{}','2026-08-11 12:28:38.203','2026-08-11 12:28:38.203',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('f0ff354b-e9fc-4c92-ad80-c8333c7f61bc','a7c7c0df-60c6-4a73-88d0-92b2fa521655','qualification','Diploma',3,1,'{}','2026-08-11 12:28:38.402','2026-08-11 12:28:38.402',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('f2656e26-54f4-441b-b166-69ed515d8476','a7c7c0df-60c6-4a73-88d0-92b2fa521655','nationality','Bangladesh',3,1,'{}','2026-08-11 12:28:39.112','2026-08-11 12:28:39.112',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('f272c110-fbc2-4077-8590-9358c3544d8d','a7c7c0df-60c6-4a73-88d0-92b2fa521655','document-checklist','Passport',1,1,'{}','2026-08-11 12:28:38.614','2026-08-11 12:28:38.614',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('f28f9e26-d568-4e73-8395-1712920cfa99','a7c7c0df-60c6-4a73-88d0-92b2fa521655','university','York University',5,1,'{}','2026-08-11 12:28:38.140','2026-08-11 12:28:38.140',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('f2e1fe3d-388c-4f50-9dbb-600551f4b731','a7c7c0df-60c6-4a73-88d0-92b2fa521655','tags','Visa Ready',6,1,'{}','2026-08-11 12:28:38.985','2026-08-11 12:28:38.985',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('f7921724-79e9-4e1a-9b56-7a5bf5cd9d90','a7c7c0df-60c6-4a73-88d0-92b2fa521655','maritalStatus','Married',2,1,'{}','2026-08-11 12:28:39.136','2026-08-11 12:28:39.136',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('f967f986-1c06-4e4c-820c-f6df1393fe33','a7c7c0df-60c6-4a73-88d0-92b2fa521655','document-checklist','CV / Resume',7,1,'{}','2026-08-11 12:28:38.637','2026-08-11 12:28:38.637',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('fbddafcc-36f2-4d5f-8a34-985aa1d3b907','a7c7c0df-60c6-4a73-88d0-92b2fa521655','intake','Apr-2027',9,1,'{}','2026-08-11 12:28:38.299','2026-08-11 12:28:38.299',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('fd9b80c7-9a61-4679-8375-2218dc3cfde5','a7c7c0df-60c6-4a73-88d0-92b2fa521655','applyLevel','Bachelors',3,1,'{}','2026-08-11 12:28:38.505','2026-08-11 12:28:38.505',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('ff579aa8-882b-4cd7-8caf-1c124707e36c','a7c7c0df-60c6-4a73-88d0-92b2fa521655','course','LLM',14,1,'{}','2026-08-11 12:28:38.240','2026-08-11 12:28:38.240',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('fffd60ee-1fff-473c-9172-98b211ffa567','a7c7c0df-60c6-4a73-88d0-92b2fa521655','gender','Prefer not to say',4,1,'{}','2026-08-11 12:28:39.099','2026-08-11 12:28:39.099',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf');
/*!40000 ALTER TABLE `master_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_items`
--

DROP TABLE IF EXISTS `menu_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `menu_items` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `icon` varchar(191) DEFAULT NULL,
  `route` varchar(191) DEFAULT NULL,
  `permissionKey` varchar(191) DEFAULT NULL,
  `parentId` varchar(191) DEFAULT NULL,
  `displayOrder` int(11) NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `menu_items_parentId_idx` (`parentId`),
  KEY `menu_items_displayOrder_idx` (`displayOrder`),
  KEY `menu_items_permissionKey_fkey` (`permissionKey`),
  CONSTRAINT `menu_items_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `menu_items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `menu_items_permissionKey_fkey` FOREIGN KEY (`permissionKey`) REFERENCES `permissions` (`key`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_items`
--

LOCK TABLES `menu_items` WRITE;
/*!40000 ALTER TABLE `menu_items` DISABLE KEYS */;
INSERT INTO `menu_items` VALUES ('021877f3-2544-4737-942d-599f0f23f1ce','Tax','FiPercent','/master/tax','settings.view','44c9b5f2-cd85-4287-a5fc-6d574dfeb1b1',4,1,'2026-07-04 06:46:04.323','2026-07-04 06:46:04.323'),('0481e122-202b-4707-ac46-c986463cb0dc','Qualification','FiAward','/master/qualification','settings.view','56b279e7-9714-4f53-a6f4-542dfb6eb643',5,1,'2026-07-04 06:46:04.301','2026-07-04 06:46:04.301'),('19456078-3e82-446b-84a0-c66d3b4f4d57','Reports','FiBarChart2','/reports','reports.view',NULL,8,1,'2026-07-04 06:46:04.266','2026-07-04 06:46:04.266'),('1ca1df28-c6ce-4055-aeec-e801eb2d85d8','Partners','FiLink2','/partners','partner.view',NULL,7,1,'2026-07-04 06:46:04.264','2026-07-04 06:46:04.264'),('2a4d3742-8ac1-428c-823f-11bdf2197814','Payment Mode','FiCreditCard','/master/payment-mode','settings.view','44c9b5f2-cd85-4287-a5fc-6d574dfeb1b1',2,1,'2026-07-04 06:46:04.318','2026-07-04 06:46:04.318'),('2adc8d15-bce5-4fe9-ade0-0da1c0ab8ae0','Reception','FiInbox',NULL,NULL,'86c547b4-29eb-4af0-bf7d-33cf2c9d904f',7,1,'2026-07-04 06:46:04.337','2026-07-04 06:46:04.337'),('2bca99f7-090d-4bfa-9a54-97999b40e31a','Students','FiBookOpen','/students','student.view',NULL,4,1,'2026-07-04 06:46:04.245','2026-07-04 06:46:04.245'),('2d39f7da-8b76-4406-b341-d1e2e9058683','System','FiSliders',NULL,NULL,'86c547b4-29eb-4af0-bf7d-33cf2c9d904f',8,1,'2026-07-04 06:46:04.345','2026-07-04 06:46:04.345'),('2f3df49b-8170-4a7f-9636-7cf37242e1e3','Roles','FiShield','/roles','roles.view','bfdc7576-0d71-469d-a9f9-53a57e446a4e',2,1,'2026-07-04 06:46:04.356','2026-07-04 06:46:04.356'),('30424030-0745-49f3-8a4a-4c8b4b17ddcc','Lead Source','FiTarget','/master/lead-source','settings.view','c4e059a8-dc4e-4594-a88a-de9012ff580b',1,1,'2026-07-04 06:46:04.329','2026-07-04 06:46:04.329'),('38302cc4-01ea-4f91-bad3-e2fb93d1b038','Visa Processing','FiGlobe','/visas','visa.view','844daeca-30a9-4e25-a1be-34c16012aa8f',2,1,'2026-07-04 06:46:04.253','2026-07-04 06:46:04.253'),('3f3bf1e4-4c3e-44fc-b57c-1b400d126307','Settings','FiSliders','/settings','settings.view','bfdc7576-0d71-469d-a9f9-53a57e446a4e',3,1,'2026-07-04 06:46:04.360','2026-07-04 06:46:04.360'),('44c9b5f2-cd85-4287-a5fc-6d574dfeb1b1','Finance','FiDollarSign',NULL,NULL,'86c547b4-29eb-4af0-bf7d-33cf2c9d904f',5,1,'2026-07-04 06:46:04.314','2026-07-04 06:46:04.314'),('529c6556-8437-4de6-a58e-271fa1ac3f79','Visa','FiGlobe',NULL,NULL,'86c547b4-29eb-4af0-bf7d-33cf2c9d904f',4,1,'2026-07-04 06:46:04.303','2026-07-04 06:46:04.303'),('532a3cc0-13cf-4ea6-926a-fdc20475cb65','Country','FiGlobe','/master/country','settings.view','56b279e7-9714-4f53-a6f4-542dfb6eb643',1,1,'2026-07-04 06:46:04.290','2026-07-04 06:46:04.290'),('56b279e7-9714-4f53-a6f4-542dfb6eb643','Academic','FiBookOpen',NULL,NULL,'86c547b4-29eb-4af0-bf7d-33cf2c9d904f',3,1,'2026-07-04 06:46:04.288','2026-07-04 06:46:04.288'),('58633fcd-0f64-404b-a6b1-31c172b9236f','Currency','FiDollarSign','/master/currency','settings.view','44c9b5f2-cd85-4287-a5fc-6d574dfeb1b1',3,1,'2026-07-04 06:46:04.321','2026-07-04 06:46:04.321'),('608d3862-1d98-4fde-a716-1b5b81339d10','Finance','FiDollarSign',NULL,NULL,NULL,6,1,'2026-07-04 06:46:04.257','2026-07-04 06:46:04.257'),('69ddabe4-175b-41f0-8477-ab27352c550c','Manage Enquiry','FiInbox','/enquiries','enquiry.view',NULL,2,1,'2026-07-04 06:46:04.239','2026-07-04 06:46:04.239'),('6cfb3f5a-ae50-4cca-865c-a0f11c42e1e5','Document Checklist','FiFileText','/master/document-checklist','settings.view','529c6556-8437-4de6-a58e-271fa1ac3f79',2,1,'2026-07-04 06:46:04.308','2026-07-04 06:46:04.308'),('83b007fa-7b35-4432-a14d-54789958b267','University','FiBook','/master/university','settings.view','56b279e7-9714-4f53-a6f4-542dfb6eb643',2,1,'2026-07-04 06:46:04.293','2026-07-04 06:46:04.293'),('844daeca-30a9-4e25-a1be-34c16012aa8f','Admission','FiClipboard',NULL,NULL,NULL,5,1,'2026-07-04 06:46:04.248','2026-07-04 06:46:04.248'),('851b6861-9fb7-42f0-ae9a-083974b43b58','Course','FiBookOpen','/master/course','settings.view','56b279e7-9714-4f53-a6f4-542dfb6eb643',3,1,'2026-07-04 06:46:04.296','2026-07-04 06:46:04.296'),('86c547b4-29eb-4af0-bf7d-33cf2c9d904f','Master Data','FiDatabase',NULL,NULL,NULL,9,1,'2026-07-04 06:46:04.268','2026-07-04 06:46:04.268'),('875dfcbb-4bbd-4891-8c2e-3d47f85a9adb','Visit Purpose','FiInbox','/master/visit-purpose','settings.view','2adc8d15-bce5-4fe9-ade0-0da1c0ab8ae0',1,1,'2026-07-04 06:46:04.339','2026-07-04 06:46:04.339'),('88108f97-740d-4b89-aac4-cde07d88c1fe','Organization','FiHome',NULL,NULL,'86c547b4-29eb-4af0-bf7d-33cf2c9d904f',2,1,'2026-07-04 06:46:04.274','2026-07-04 06:46:04.274'),('8d0ebf21-db92-4e3c-9c81-33fda4033aa5','Embassy','FiMapPin','/master/embassy','settings.view','529c6556-8437-4de6-a58e-271fa1ac3f79',3,1,'2026-07-04 06:46:04.311','2026-07-04 06:46:04.311'),('9c25b7d1-0a16-4a1f-a58c-74ff0510d84d','Master Hub','FiGrid','/master','settings.view','86c547b4-29eb-4af0-bf7d-33cf2c9d904f',1,1,'2026-07-04 06:46:04.271','2026-07-04 06:46:04.271'),('ad7161f2-0cae-4486-887b-0615c2c0e5b3','Invoices','FiFileText','/invoices','accounts.invoice.view','608d3862-1d98-4fde-a716-1b5b81339d10',1,1,'2026-07-04 06:46:04.261','2026-07-04 06:46:04.261'),('b5bc53be-09eb-494a-b7dd-d41216276c9a','Fee Type','FiDollarSign','/master/fee-type','settings.view','44c9b5f2-cd85-4287-a5fc-6d574dfeb1b1',1,1,'2026-07-04 06:46:04.316','2026-07-04 06:46:04.316'),('b7a5d287-f580-4da9-82d3-6edac1518464','Communication Template','FiMail','/master/communication-template','settings.manage','2d39f7da-8b76-4406-b341-d1e2e9058683',1,1,'2026-07-04 06:46:04.348','2026-07-04 06:46:04.348'),('bce33886-64a3-462e-9006-5b680a8a9dfb','Feature Toggle','FiToggleLeft','/settings/feature-toggle','settings.manage','2d39f7da-8b76-4406-b341-d1e2e9058683',2,1,'2026-07-04 06:46:04.350','2026-07-04 06:46:04.350'),('bfdc7576-0d71-469d-a9f9-53a57e446a4e','Administration','FiShield',NULL,NULL,NULL,10,1,'2026-07-04 06:46:04.352','2026-07-04 06:46:04.352'),('c4e059a8-dc4e-4594-a88a-de9012ff580b','CRM','FiTarget',NULL,NULL,'86c547b4-29eb-4af0-bf7d-33cf2c9d904f',6,1,'2026-07-04 06:46:04.326','2026-07-04 06:46:04.326'),('ca9e6e7b-1398-444a-b98a-0d278cca1263','Dashboard','FiLayout','/dashboard','dashboard.view',NULL,1,1,'2026-07-04 06:46:04.235','2026-07-04 06:46:04.235'),('cbc59157-817e-42ac-abaf-25738429b8ef','Visa Type','FiGlobe','/master/visa-type','settings.view','529c6556-8437-4de6-a58e-271fa1ac3f79',1,1,'2026-07-04 06:46:04.306','2026-07-04 06:46:04.306'),('d07c3dba-db46-434d-950a-adb15589956b','Tags','FiTag','/master/tags','settings.view','c4e059a8-dc4e-4594-a88a-de9012ff580b',3,1,'2026-07-04 06:46:04.334','2026-07-04 06:46:04.334'),('d2efa20e-87a7-4579-bddd-812074bcd12d','Documents','FiFolder','/documents','document.view','844daeca-30a9-4e25-a1be-34c16012aa8f',3,1,'2026-07-04 06:46:04.255','2026-07-04 06:46:04.255'),('de61d89f-14d9-4b6d-81a0-b4e3d55bc30e','Applications','FiClipboard','/applications','application.view','844daeca-30a9-4e25-a1be-34c16012aa8f',1,1,'2026-07-04 06:46:04.251','2026-07-04 06:46:04.251'),('e19cf541-4015-4a70-9e18-a2b2ca2d2108','Users','FiUserCheck','/users','users.view','bfdc7576-0d71-469d-a9f9-53a57e446a4e',1,1,'2026-07-04 06:46:04.354','2026-07-04 06:46:04.354'),('e61d78e0-69b3-4818-9e7c-f618f98963bc','Intake','FiCalendar','/master/intake','settings.view','56b279e7-9714-4f53-a6f4-542dfb6eb643',4,1,'2026-07-04 06:46:04.298','2026-07-04 06:46:04.298'),('e77bbb9d-2594-491a-9d44-dd1788169b3f','Branch','FiMapPin','/master/branch','settings.manage','88108f97-740d-4b89-aac4-cde07d88c1fe',2,1,'2026-07-04 06:46:04.282','2026-07-04 06:46:04.282'),('e7970272-9b7d-4962-bf0f-4aef24169fd3','Company','FiHome','/master/company','settings.manage','88108f97-740d-4b89-aac4-cde07d88c1fe',1,1,'2026-07-04 06:46:04.278','2026-07-04 06:46:04.278'),('ec817b98-358c-474b-b497-cb33b050318a','Counsellor Skill','FiUserCheck','/master/counsellor-skill','settings.manage','2adc8d15-bce5-4fe9-ade0-0da1c0ab8ae0',2,1,'2026-07-04 06:46:04.343','2026-07-04 06:46:04.343'),('efac907d-8fba-487a-9cef-06f93023cd21','Enquiry Status','FiActivity','/master/enquiry-status','settings.view','c4e059a8-dc4e-4594-a88a-de9012ff580b',2,1,'2026-07-04 06:46:04.332','2026-07-04 06:46:04.332'),('f53af1c4-4cdb-4849-a93b-8da2db4b7af0','Department','FiGrid','/master/department','settings.manage','88108f97-740d-4b89-aac4-cde07d88c1fe',3,1,'2026-07-04 06:46:04.285','2026-07-04 06:46:04.285'),('feff2aa5-3427-4666-925a-c34ed31eee7a','My Queue','FiTarget','/counsellor/queue','enquiry.view',NULL,3,1,'2026-07-04 06:46:04.241','2026-07-04 06:46:04.241');
/*!40000 ALTER TABLE `menu_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notes`
--

DROP TABLE IF EXISTS `notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notes` (
  `id` varchar(191) NOT NULL,
  `studentId` varchar(191) DEFAULT NULL,
  `entityType` varchar(191) DEFAULT NULL,
  `entityId` varchar(191) DEFAULT NULL,
  `userId` varchar(191) NOT NULL,
  `content` text NOT NULL,
  `isPinned` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notes_studentId_idx` (`studentId`),
  KEY `notes_entityType_entityId_idx` (`entityType`,`entityId`),
  KEY `notes_userId_fkey` (`userId`),
  CONSTRAINT `notes_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `notes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notes`
--

LOCK TABLES `notes` WRITE;
/*!40000 ALTER TABLE `notes` DISABLE KEYS */;
/*!40000 ALTER TABLE `notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `type` enum('INFO','SUCCESS','WARNING','ERROR','REMINDER') NOT NULL DEFAULT 'INFO',
  `title` varchar(191) NOT NULL,
  `message` text NOT NULL,
  `link` varchar(191) DEFAULT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  `readAt` datetime(3) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `notifications_userId_isRead_idx` (`userId`,`isRead`),
  KEY `notifications_createdAt_idx` (`createdAt`),
  CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES ('00bc9210-1a14-4aea-9141-0d3052a66322','f16e56db-fd62-4993-a487-7fb5906e5caf','INFO','New walk-in waiting','Darshil Kachhadiya is waiting (Token H-101). Please start counselling.','/counsellor/queue?lead=5a663213-88f8-4414-aa01-04ffe6779a75',0,NULL,'{\"leadId\":\"5a663213-88f8-4414-aa01-04ffe6779a75\",\"leadCode\":\"MAIN-LEAD-2026-000001\",\"tokenNumber\":\"H-101\"}','2026-07-04 07:12:53.524'),('357e6d82-a806-4b30-aac1-2befc955694c','f16e56db-fd62-4993-a487-7fb5906e5caf','REMINDER','Follow-up overdue — Darshil Kachhadiya','No outreach on enquiry MAIN-ENQ000001 for 38 days. Smart reminder sent automatically.','/enquiries?open=262f50e2-74a4-4475-8571-f55d77a9b8d8',0,NULL,'{\"enquiryId\":\"262f50e2-74a4-4475-8571-f55d77a9b8d8\",\"enquiryCode\":\"MAIN-ENQ000001\",\"source\":\"smart_reminder\"}','2026-08-11 12:23:37.260'),('3d76601f-1545-4dbf-b1b6-184c61c3c047','f16e56db-fd62-4993-a487-7fb5906e5caf','INFO','New walk-in waiting','Rahul Patel is waiting (Token H-101). Please start counselling.','/counsellor/queue?lead=41c1ec0d-ff02-4741-9aa8-8acea690e181',0,NULL,'{\"leadId\":\"41c1ec0d-ff02-4741-9aa8-8acea690e181\",\"leadCode\":\"MAIN-LEAD-2026-000002\",\"tokenNumber\":\"H-101\"}','2026-07-06 07:45:07.578'),('b3a57e1e-ed25-419f-8f48-f3704e282096','f16e56db-fd62-4993-a487-7fb5906e5caf','REMINDER','Follow-up overdue — Rahul Patel','No outreach on enquiry MAIN-ENQ000002 for 36 days. Smart reminder sent automatically.','/enquiries?open=cf4ba80b-9f14-4321-aa4d-3c7c626ca345',0,NULL,'{\"enquiryId\":\"cf4ba80b-9f14-4321-aa4d-3c7c626ca345\",\"enquiryCode\":\"MAIN-ENQ000002\",\"source\":\"smart_reminder\"}','2026-08-12 06:02:03.653');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partners`
--

DROP TABLE IF EXISTS `partners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `partners` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `type` varchar(191) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `country` varchar(191) DEFAULT NULL,
  `website` varchar(191) DEFAULT NULL,
  `commission` decimal(10,2) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `partners_code_key` (`code`),
  KEY `partners_code_idx` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partners`
--

LOCK TABLES `partners` WRITE;
/*!40000 ALTER TABLE `partners` DISABLE KEYS */;
/*!40000 ALTER TABLE `partners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_modes`
--

DROP TABLE IF EXISTS `payment_modes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_modes` (
  `id` varchar(191) NOT NULL,
  `companyId` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_modes_companyId_code_key` (`companyId`,`code`),
  KEY `payment_modes_companyId_idx` (`companyId`),
  KEY `payment_modes_isActive_idx` (`isActive`),
  CONSTRAINT `payment_modes_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_modes`
--

LOCK TABLES `payment_modes` WRITE;
/*!40000 ALTER TABLE `payment_modes` DISABLE KEYS */;
INSERT INTO `payment_modes` VALUES ('04908186-9247-4bd3-8b42-b421536f0dd7','a7c7c0df-60c6-4a73-88d0-92b2fa521655','CREDIT_CARD','Credit Card',NULL,1,4,'2026-08-11 12:55:28.732','2026-08-11 12:55:28.732',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('10c31e06-dd7f-44bb-80ab-62a63e71e562','a7c7c0df-60c6-4a73-88d0-92b2fa521655','CASH','Cash',NULL,1,1,'2026-08-11 12:55:28.703','2026-08-11 12:55:28.703',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('1d6455c4-88db-47a7-8556-dbe7392a6522','a7c7c0df-60c6-4a73-88d0-92b2fa521655','CHEQUE','Cheque',NULL,1,6,'2026-08-11 12:55:28.753','2026-08-11 12:55:28.753',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('24c4a56a-7532-400a-a603-d9a6555731c7','a7c7c0df-60c6-4a73-88d0-92b2fa521655','UPI','UPI',NULL,1,3,'2026-08-11 12:55:28.718','2026-08-11 12:55:28.718',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('6205bb86-2008-4dc5-a386-1df2a0b09702','a7c7c0df-60c6-4a73-88d0-92b2fa521655','BANK_TRANSFER','Bank Transfer',NULL,1,2,'2026-08-11 12:55:28.711','2026-08-11 12:55:28.711',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('80123190-aafc-4559-9621-969cae05ea50','a7c7c0df-60c6-4a73-88d0-92b2fa521655','OTHER','Other',NULL,1,8,'2026-08-11 12:55:28.766','2026-08-11 12:55:28.766',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('88e2b026-6ab9-4d9e-ad7e-6da6ebb39bfb','a7c7c0df-60c6-4a73-88d0-92b2fa521655','DEBIT_CARD','Debit Card',NULL,1,5,'2026-08-11 12:55:28.747','2026-08-11 12:55:28.747',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('bc483460-f5e6-4c64-9848-d8e20b261428','a7c7c0df-60c6-4a73-88d0-92b2fa521655','ONLINE','Online',NULL,1,7,'2026-08-11 12:55:28.761','2026-08-11 12:55:28.761',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf');
/*!40000 ALTER TABLE `payment_modes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permissions` (
  `id` varchar(191) NOT NULL,
  `key` varchar(191) NOT NULL,
  `module` varchar(191) NOT NULL,
  `action` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `groupName` varchar(191) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_key_key` (`key`),
  KEY `permissions_module_idx` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES ('0433a832-aae0-47b0-b1f5-97aa5088691c','roles.delete','roles','delete','Delete Roles',NULL,'Administration',1,'2026-07-04 06:34:51.949','2026-07-04 06:46:03.922'),('0bb2f826-6845-4973-9c79-9f0a3f78bec3','reception.walkin.view','reception','walkin.view','View Walk-ins',NULL,'Reception',1,'2026-07-04 06:34:51.694','2026-07-04 06:46:03.767'),('0c718d16-0e28-493f-8b8e-f7ae63be3118','roles.view','roles','view','View Roles',NULL,'Administration',1,'2026-07-04 06:34:51.937','2026-07-04 06:46:03.914'),('0ef90aa2-2f9e-4034-b621-5976ab579831','partner.view','partner','view','View Partners',NULL,'Partner',1,'2026-07-04 06:34:51.887','2026-07-04 06:46:03.870'),('0f1fc73d-184f-4e9b-8e84-b613eecb86ad','masters.view','masters','view','View Masters',NULL,'Settings',1,'2026-08-12 05:35:49.889','2026-08-12 05:35:49.889'),('1e7d4627-e3fd-4d78-82b0-51b0a882fc96','partner.delete','partner','delete','Delete Partner',NULL,'Partner',1,'2026-07-04 06:34:51.898','2026-07-04 06:46:03.880'),('2061e10d-a31d-414f-9888-6dcd1f726a6c','masters.manage','masters','manage','Manage Masters',NULL,'Settings',1,'2026-07-04 06:34:51.974','2026-08-12 05:35:49.937'),('212696d3-f656-42de-9cdf-35ed9da4d3b6','users.view','users','view','View Users',NULL,'Administration',1,'2026-07-04 06:34:51.921','2026-07-04 06:46:03.900'),('2224313d-808d-4e97-93e7-e74fdc4004d6','lead.view','lead','view','View Leads',NULL,'Lead',1,'2026-07-04 06:34:51.669','2026-07-04 06:46:03.747'),('2efe2986-702f-477f-b4a9-1d283c3c1ddc','enquiry.view','enquiry','view','View Enquiries',NULL,'Enquiry',1,'2026-07-04 06:34:51.554','2026-07-04 06:46:03.713'),('366b0757-7dac-4f20-98ea-97a62920f4c1','lead.assign','lead','assign','Assign Lead',NULL,'Lead',1,'2026-07-04 06:34:51.686','2026-07-04 06:46:03.761'),('37c8a5b7-febd-454b-8f18-d98a5a6c0fe2','visa.reject','visa','reject','Reject Visa',NULL,'Visa',1,'2026-07-04 06:34:51.857','2026-07-04 06:46:03.850'),('3b778fe3-98d7-4d1e-8df1-ceec166a0b20','visa.view','visa','view','View Visas',NULL,'Visa',1,'2026-07-04 06:34:51.806','2026-07-04 06:46:03.830'),('3e7d6a13-f531-4269-826c-a934ec04e049','roles.assign','roles','assign','Assign Users to Role',NULL,'Administration',1,'2026-07-04 06:34:51.953','2026-07-04 06:46:03.926'),('3f4f335b-1cdb-49df-83ab-d7c73898c6ca','visa.create','visa','create','Create Visa',NULL,'Visa',1,'2026-07-04 06:34:51.810','2026-07-04 06:46:03.833'),('433a7843-b7f6-42d1-82f0-d7164aeb2b69','document.view','document','view','View Documents',NULL,'Document',1,'2026-07-04 06:34:51.902','2026-07-04 06:46:03.883'),('467a5493-3fd3-48c7-90c2-0bf3bf616b68','visa.delete','visa','delete','Delete Visa',NULL,'Visa',1,'2026-07-04 06:34:51.840','2026-07-04 06:46:03.841'),('48d7b224-37bf-4092-8e2b-92938af744e7','accounts.payment.collect','accounts','payment.collect','Collect Payment',NULL,'Finance',1,'2026-07-04 06:34:51.883','2026-07-04 06:46:03.867'),('4ea8788e-02b8-4035-b810-adc41830c634','enquiry.import','enquiry','import','Import Enquiries',NULL,'Enquiry',1,'2026-07-04 06:34:51.653','2026-07-04 06:46:03.733'),('4f176948-9427-41ae-af77-cfa52e30d865','roles.export','roles','export','Export Roles',NULL,'Administration',1,'2026-07-04 06:34:51.956','2026-07-04 06:46:03.930'),('539f6f2c-eb43-4126-8a3a-513ebe1acf7e','accounts.invoice.delete','accounts','invoice.delete','Delete Invoice',NULL,'Finance',1,'2026-07-04 06:34:51.877','2026-07-04 06:46:03.864'),('56fc2eb8-467c-4ec2-8fe3-124fa2423949','student.export','student','export','Export Students',NULL,'Student',1,'2026-07-04 06:34:51.770','2026-07-04 06:46:03.801'),('5976cdd7-cfc5-4015-8660-01e49a2a996c','reports.export','reports','export','Export Reports',NULL,'Reports',1,'2026-07-04 06:34:51.917','2026-07-04 06:46:03.897'),('5a21fa1c-22c0-4191-b5aa-bf5f4b4e7da9','application.assign','application','assign','Assign Application',NULL,'Application',1,'2026-07-04 06:34:51.792','2026-07-04 06:46:03.818'),('5f7b2e04-a43e-4758-b1ce-20514703db91','users.update','users','update','Update Users',NULL,'Administration',1,'2026-07-04 06:34:51.928','2026-07-04 06:46:03.906'),('6e1d9cf9-e0e9-44b0-909d-1d7dff1af0b3','audit.view','audit','view','View Audit Logs',NULL,'Settings',1,'2026-07-04 06:34:51.977','2026-07-04 06:46:03.946'),('6f00eb53-f115-4265-9dbb-fb66afa4992a','lead.delete','lead','delete','Delete Lead',NULL,'Lead',1,'2026-07-04 06:34:51.682','2026-07-04 06:46:03.757'),('705c31eb-76aa-47d7-ae19-43f68a2ef14c','application.update','application','update','Update Application',NULL,'Application',1,'2026-07-04 06:34:51.784','2026-07-04 06:46:03.812'),('7098474d-2000-45cf-ba57-55ff19ef1ef0','application.create','application','create','Create Application',NULL,'Application',1,'2026-07-04 06:34:51.778','2026-07-04 06:46:03.807'),('727e2483-3478-4f1b-9bd2-84c7f16d809e','roles.create','roles','create','Create Roles',NULL,'Administration',1,'2026-07-04 06:34:51.942','2026-07-04 06:46:03.917'),('768e7fac-7830-4d77-9b3a-688307163d51','roles.update','roles','update','Update Roles',NULL,'Administration',1,'2026-07-04 06:34:51.945','2026-07-04 06:46:03.920'),('787727d2-5f99-4a84-9d01-df473a7cc207','application.delete','application','delete','Delete Application',NULL,'Application',1,'2026-07-04 06:34:51.788','2026-07-04 06:46:03.815'),('7a8be1b6-c030-4300-8d4d-9bbf84df1183','reports.view','reports','view','View Reports',NULL,'Reports',1,'2026-07-04 06:34:51.912','2026-07-04 06:46:03.893'),('858d9235-869e-48fa-ac0c-06ec23a3af7b','users.create','users','create','Create Users',NULL,'Administration',1,'2026-07-04 06:34:51.925','2026-07-04 06:46:03.903'),('85edbe0d-c7cd-4bf0-8062-9ac11a39c1fe','application.view','application','view','View Applications',NULL,'Application',1,'2026-07-04 06:34:51.774','2026-07-04 06:46:03.804'),('86ed4d02-863f-4ee9-a54a-45cadc6a9cfb','lead.export','lead','export','Export Leads',NULL,'Lead',1,'2026-07-04 06:34:51.690','2026-07-04 06:46:03.764'),('8950992f-2e27-40d5-9657-d26cd31a19c6','settings.view','settings','view','View Settings',NULL,'Settings',1,'2026-07-04 06:34:51.966','2026-07-04 06:46:03.935'),('8b28fa52-316b-456a-85c1-6393e2d8a0dc','dashboard.analytics','dashboard','analytics','Dashboard Analytics',NULL,'Dashboard',1,'2026-07-04 06:34:51.098','2026-07-04 06:46:03.705'),('8b9ceb8b-b3ee-47df-b704-85adbecc8fdd','student.assign','student','assign','Assign Student',NULL,'Student',1,'2026-07-04 06:34:51.765','2026-07-04 06:46:03.798'),('926c8379-2fba-4f09-9f3d-c525d5c55165','application.finalize','application','finalize','Finalize Application',NULL,'Application',1,'2026-07-04 06:34:51.802','2026-07-04 06:46:03.826'),('93a79d42-1a2c-420d-a12e-cf8260ed2508','reception.walkin.delete','reception','walkin.delete','Delete Walk-in',NULL,'Reception',1,'2026-07-04 06:34:51.719','2026-07-04 06:46:03.778'),('99df5214-97ef-471a-b644-194ebf2e716a','accounts.invoice.edit','accounts','invoice.edit','Edit Invoice',NULL,'Finance',1,'2026-07-04 06:34:51.874','2026-07-04 06:46:03.859'),('9aa3e079-0991-4090-a668-e4536e08ee11','enquiry.update','enquiry','update','Update Enquiry',NULL,'Enquiry',1,'2026-07-04 06:34:51.640','2026-07-04 06:46:03.721'),('9c27177c-315a-4d57-9b8e-32a9d46134ab','student.update','student','update','Update Student',NULL,'Student',1,'2026-07-04 06:34:51.743','2026-07-04 06:46:03.790'),('a58d610e-fb56-41bb-9dde-e52a4fd36d9e','roles.clone','roles','clone','Clone Roles',NULL,'Administration',1,'2026-07-04 06:34:51.960','2026-07-04 06:46:03.932'),('a970135e-110c-45b5-a3b1-41de30ac1eb2','accounts.invoice.create','accounts','invoice.create','Create Invoice',NULL,'Finance',1,'2026-07-04 06:34:51.867','2026-07-04 06:46:03.855'),('b103d9c8-f64a-4849-b4d8-512b57006d10','enquiry.bulk','enquiry','bulk','Bulk Enquiry Actions',NULL,'Enquiry',1,'2026-07-04 06:34:51.665','2026-07-04 06:46:03.743'),('b2ecc664-496a-4f5e-b9d9-81514250b271','enquiry.assign','enquiry','assign','Assign Enquiry',NULL,'Enquiry',1,'2026-07-04 06:34:51.649','2026-07-04 06:46:03.729'),('b4cf4220-d8e9-4b7b-8b2c-56ef1f65f5ee','visa.update','visa','update','Update Visa',NULL,'Visa',1,'2026-07-04 06:34:51.835','2026-07-04 06:46:03.838'),('b7f9fd17-162e-4164-8ed7-20f983edd3bb','dashboard.export','dashboard','export','Export Dashboard',NULL,'Dashboard',1,'2026-07-04 06:34:51.161','2026-07-04 06:46:03.709'),('b9243c66-8055-43aa-8fb5-251de4586fee','enquiry.approve','enquiry','approve','Approve Enquiry',NULL,'Enquiry',1,'2026-07-04 06:34:51.660','2026-07-04 06:46:03.739'),('bb54868e-b495-4a85-b857-1c1100c94fbd','lead.create','lead','create','Create Lead',NULL,'Lead',1,'2026-07-04 06:34:51.673','2026-07-04 06:46:03.750'),('bd548451-7f7a-400e-98a3-74bcf364500f','enquiry.delete','enquiry','delete','Delete Enquiry',NULL,'Enquiry',1,'2026-07-04 06:34:51.644','2026-07-04 06:46:03.725'),('c23f4c80-952b-4378-9dd5-b095c35d2398','accounts.invoice.view','accounts','invoice.view','View Invoices',NULL,'Finance',1,'2026-07-04 06:34:51.861','2026-07-04 06:46:03.853'),('caf667fe-4599-40ce-b370-74de83bb11db','reception.walkin.update','reception','walkin.update','Update Walk-in',NULL,'Reception',1,'2026-07-04 06:34:51.715','2026-07-04 06:46:03.774'),('d1bbcc34-2e47-47f5-9d04-c3fc1e666c02','student.view','student','view','View Students',NULL,'Student',1,'2026-07-04 06:34:51.732','2026-07-04 06:46:03.784'),('d57c15fa-3e12-41d1-ac56-80c3d3cdd477','settings.manage','settings','manage','Manage Settings',NULL,'Settings',1,'2026-07-04 06:34:51.971','2026-07-04 06:46:03.939'),('d610c5f0-3a25-40bf-989e-8df01eba1363','document.delete','document','delete','Delete Documents',NULL,'Document',1,'2026-07-04 06:34:51.909','2026-07-04 06:46:03.888'),('d6185005-04b1-4ae3-b94d-929e80f2c8e4','student.create','student','create','Create Student',NULL,'Student',1,'2026-07-04 06:34:51.738','2026-07-04 06:46:03.787'),('d67c4e22-65af-4450-a934-86965fc74bd6','visa.approve','visa','approve','Approve Visa',NULL,'Visa',1,'2026-07-04 06:34:51.844','2026-07-04 06:46:03.846'),('da44374e-eff5-4708-b46a-169f72b148a8','partner.create','partner','create','Create Partner',NULL,'Partner',1,'2026-07-04 06:34:51.890','2026-07-04 06:46:03.872'),('dc5a2fe1-0533-445b-ab70-bcd7597c9887','users.delete','users','delete','Delete Users',NULL,'Administration',1,'2026-07-04 06:34:51.933','2026-07-04 06:46:03.910'),('e514356e-31c2-4608-8685-2765c3a54dd1','enquiry.export','enquiry','export','Export Enquiries',NULL,'Enquiry',1,'2026-07-04 06:34:51.657','2026-07-04 06:46:03.736'),('e6900af0-3403-42a7-9dde-ec10f06015b4','partner.update','partner','update','Update Partner',NULL,'Partner',1,'2026-07-04 06:34:51.894','2026-07-04 06:46:03.876'),('e8284b2c-0d6e-4c9a-9cbd-1d2839e7c39d','enquiry.create','enquiry','create','Create Enquiry',NULL,'Enquiry',1,'2026-07-04 06:34:51.622','2026-07-04 06:46:03.718'),('eb71a17a-58ed-4295-97a1-e7416c4c3e7d','reception.walkin.assign','reception','walkin.assign','Assign Walk-in Counsellor',NULL,'Reception',1,'2026-07-04 06:34:51.723','2026-07-04 06:46:03.781'),('ecd1ad5b-58cc-4be3-a707-4dd39a25f4dd','document.upload','document','upload','Upload Documents',NULL,'Document',1,'2026-07-04 06:34:51.905','2026-07-04 06:46:03.886'),('f43d6f6b-dbee-4678-abd2-615711392bbb','application.submit','application','submit','Submit Application',NULL,'Application',1,'2026-07-04 06:34:51.797','2026-07-04 06:46:03.822'),('f5366c15-ee08-44a4-b8dd-882ab7fffe32','reception.walkin.create','reception','walkin.create','Register Walk-in',NULL,'Reception',1,'2026-07-04 06:34:51.699','2026-07-04 06:46:03.770'),('f9b149d0-30c7-4cf2-a1ce-e0ec2d92bd69','lead.update','lead','update','Update Lead',NULL,'Lead',1,'2026-07-04 06:34:51.677','2026-07-04 06:46:03.754'),('fa46e516-2562-4175-b865-51228f09f365','student.delete','student','delete','Delete Student',NULL,'Student',1,'2026-07-04 06:34:51.749','2026-07-04 06:46:03.794'),('fb3ec72c-7716-488c-b5c9-c0c7970f1de7','dashboard.view','dashboard','view','View Dashboard',NULL,'Dashboard',1,'2026-07-04 06:34:51.024','2026-07-04 06:46:03.698');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `qualifications`
--

DROP TABLE IF EXISTS `qualifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `qualifications` (
  `id` varchar(191) NOT NULL,
  `companyId` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `level` varchar(191) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `qualifications_companyId_code_key` (`companyId`,`code`),
  KEY `qualifications_companyId_idx` (`companyId`),
  KEY `qualifications_isActive_idx` (`isActive`),
  CONSTRAINT `qualifications_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `qualifications`
--

LOCK TABLES `qualifications` WRITE;
/*!40000 ALTER TABLE `qualifications` DISABLE KEYS */;
INSERT INTO `qualifications` VALUES ('1ef00534-3c18-419b-8b53-4ad1d5b25ebd','a7c7c0df-60c6-4a73-88d0-92b2fa521655','MASTER','Master\'s Degree','Postgraduate',NULL,1,5,'2026-08-11 12:55:28.580','2026-08-11 12:55:28.580',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('30f8937c-3ee1-48ab-81e7-6ed451d36e3e','a7c7c0df-60c6-4a73-88d0-92b2fa521655','12TH','12th Standard','Higher Secondary',NULL,1,2,'2026-08-11 12:55:28.564','2026-08-11 12:55:28.564',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('323a82c4-e804-41bb-8726-a58529b1f09f','a7c7c0df-60c6-4a73-88d0-92b2fa521655','10TH','10th Standard','Secondary',NULL,1,1,'2026-08-11 12:55:28.559','2026-08-11 12:55:28.559',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('43e11a66-be73-4608-9ea7-1630a4318f5a','a7c7c0df-60c6-4a73-88d0-92b2fa521655','DIPLOMA','Diploma','Diploma',NULL,1,3,'2026-08-11 12:55:28.569','2026-08-11 12:55:28.569',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('65711c01-efd9-4a4b-8e02-2385321e9a7a','a7c7c0df-60c6-4a73-88d0-92b2fa521655','BACHELOR','Bachelor\'s Degree','Undergraduate',NULL,1,4,'2026-08-11 12:55:28.576','2026-08-11 12:55:28.576',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('ae384000-aa47-4315-8525-dffb5ac9c2d3','a7c7c0df-60c6-4a73-88d0-92b2fa521655','PHD','PhD / Doctorate','Doctoral',NULL,1,6,'2026-08-11 12:55:28.584','2026-08-11 12:55:28.584',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('e877e003-7216-4127-84a4-540fc100fce3','a7c7c0df-60c6-4a73-88d0-92b2fa521655','OTHER','Other','Other',NULL,1,7,'2026-08-11 12:55:28.589','2026-08-11 12:55:28.589',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf');
/*!40000 ALTER TABLE `qualifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `refresh_tokens` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `token` varchar(500) NOT NULL,
  `expiresAt` datetime(3) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `revokedAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `refresh_tokens_token_key` (`token`),
  KEY `refresh_tokens_userId_idx` (`userId`),
  KEY `refresh_tokens_token_idx` (`token`),
  CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
INSERT INTO `refresh_tokens` VALUES ('32c9c390-617e-4133-af99-02093f2e1f85','f16e56db-fd62-4993-a487-7fb5906e5caf','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmMTZlNTZkYi1mZDYyLTQ5OTMtYTQ4Ny03ZmI1OTA2ZTVjYWYiLCJlbWFpbCI6ImFkbWluQGNybS5jb20iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3ODMzMTU0NDAsImV4cCI6MTc4MzkyMDI0MH0.L24H0vzceVAHoo1no1wc1a5GxKooJbjXnFfNNTrjEoM','2026-07-13 05:24:00.636','2026-07-06 05:24:00.643','2026-07-06 07:33:45.145'),('46ba7456-a99b-4134-8991-a0af108251be','f16e56db-fd62-4993-a487-7fb5906e5caf','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmMTZlNTZkYi1mZDYyLTQ5OTMtYTQ4Ny03ZmI1OTA2ZTVjYWYiLCJlbWFpbCI6ImFkbWluQGNybS5jb20iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3ODMzMTU0NTQsImV4cCI6MTc4MzkyMDI1NH0.oYHqUqfcL7NAiQuVprKM9cIVKNO57IwvKgxyD9OPbMQ','2026-07-13 05:24:14.983','2026-07-06 05:24:14.990',NULL),('588c374b-cd48-4509-a5d9-e66b9f4c7a6b','f16e56db-fd62-4993-a487-7fb5906e5caf','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmMTZlNTZkYi1mZDYyLTQ5OTMtYTQ4Ny03ZmI1OTA2ZTVjYWYiLCJlbWFpbCI6ImFkbWluQGNybS5jb20iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3ODY0NTA3ODcsImV4cCI6MTc4NzA1NTU4N30.GVmj7XwTSQVMM5JHfQ5W--xOLHIKs_fJEXf1yWXpyVI','2026-08-18 12:19:47.599','2026-08-11 12:19:47.600',NULL),('5cec9c5c-b0ec-4af9-a981-e0285251c106','f16e56db-fd62-4993-a487-7fb5906e5caf','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmMTZlNTZkYi1mZDYyLTQ5OTMtYTQ4Ny03ZmI1OTA2ZTVjYWYiLCJlbWFpbCI6ImFkbWluQGNybS5jb20iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3ODMzMzg5MjYsImV4cCI6MTc4Mzk0MzcyNn0.9qkEcij0A_JaMLKZYdMXBgU-XuC0nz2NoEpgBUUs8j4','2026-07-13 11:55:26.888','2026-07-06 11:55:26.890',NULL),('616bbdcd-0697-47af-a285-6a597f71dd74','f16e56db-fd62-4993-a487-7fb5906e5caf','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmMTZlNTZkYi1mZDYyLTQ5OTMtYTQ4Ny03ZmI1OTA2ZTVjYWYiLCJlbWFpbCI6ImFkbWluQGNybS5jb20iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3ODY1MTMwMjMsImV4cCI6MTc4NzExNzgyM30.8qDP11VjQrp1iWry0BdfkbwktbINy0qUEs71MtSmLcY','2026-08-19 05:37:03.821','2026-08-12 05:37:03.823',NULL),('66eebaa2-a088-46bd-b03a-0067c6760f7e','f16e56db-fd62-4993-a487-7fb5906e5caf','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmMTZlNTZkYi1mZDYyLTQ5OTMtYTQ4Ny03ZmI1OTA2ZTVjYWYiLCJlbWFpbCI6ImFkbWluQGNybS5jb20iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3ODY1MTMwMDMsImV4cCI6MTc4NzExNzgwM30.3hD9QGf_VlmbTfoqIOJTzfyGceBdBMSzZVA8oLpMxFE','2026-08-19 05:36:43.789','2026-08-12 05:36:43.792',NULL),('8d2f369a-c75e-47b8-8af4-f210208f5f69','f16e56db-fd62-4993-a487-7fb5906e5caf','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmMTZlNTZkYi1mZDYyLTQ5OTMtYTQ4Ny03ZmI1OTA2ZTVjYWYiLCJlbWFpbCI6ImFkbWluQGNybS5jb20iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3ODMzMTU0NzEsImV4cCI6MTc4MzkyMDI3MX0.0ZO_jYghJuZUzZOKHwV1fb-GoLjMvOsfdjtUuJoSLDo','2026-07-13 05:24:31.265','2026-07-06 05:24:31.272',NULL),('8f02da19-01c3-4e15-8872-82a1ac375ac2','f16e56db-fd62-4993-a487-7fb5906e5caf','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmMTZlNTZkYi1mZDYyLTQ5OTMtYTQ4Ny03ZmI1OTA2ZTVjYWYiLCJlbWFpbCI6ImFkbWluQGNybS5jb20iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3ODMxNDY5NDksImV4cCI6MTc4Mzc1MTc0OX0.FEVptsoTF7bojNguOTloBpl8csazmjJqZo25OObNFNY','2026-07-11 06:35:49.328','2026-07-04 06:35:49.329',NULL),('b959d830-d0a7-4981-965f-ffba59677207','f16e56db-fd62-4993-a487-7fb5906e5caf','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmMTZlNTZkYi1mZDYyLTQ5OTMtYTQ4Ny03ZmI1OTA2ZTVjYWYiLCJlbWFpbCI6ImFkbWluQGNybS5jb20iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3ODY1MTM3NjcsImV4cCI6MTc4NzExODU2N30.iGJlVuYzKMta7WttKikbhOWfhAyd9I9ZWMDqGqhoY5c','2026-08-19 05:49:27.530','2026-08-12 05:49:27.531',NULL),('e1bfeb79-1a3f-435c-9728-83c61657cef6','f16e56db-fd62-4993-a487-7fb5906e5caf','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmMTZlNTZkYi1mZDYyLTQ5OTMtYTQ4Ny03ZmI1OTA2ZTVjYWYiLCJlbWFpbCI6ImFkbWluQGNybS5jb20iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3ODMzMjMyMjcsImV4cCI6MTc4MzkyODAyN30.FmDepiyta6xlS50TIzzsEEA-kl9WLW8kis1jUTa8zwA','2026-07-13 07:33:47.147','2026-07-06 07:33:47.148',NULL);
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_activity_logs`
--

DROP TABLE IF EXISTS `role_activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `role_activity_logs` (
  `id` varchar(191) NOT NULL,
  `roleId` varchar(191) NOT NULL,
  `userId` varchar(191) DEFAULT NULL,
  `action` enum('CREATE','UPDATE','DELETE','RESTORE','CLONE','PERMISSION_CHANGE','ASSIGN_USER','REMOVE_USER','STATUS_CHANGE','EXPORT') NOT NULL,
  `oldValue` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`oldValue`)),
  `newValue` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`newValue`)),
  `ipAddress` varchar(191) DEFAULT NULL,
  `userAgent` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `role_activity_logs_roleId_idx` (`roleId`),
  KEY `role_activity_logs_createdAt_idx` (`createdAt`),
  KEY `role_activity_logs_userId_fkey` (`userId`),
  CONSTRAINT `role_activity_logs_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `role_activity_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_activity_logs`
--

LOCK TABLES `role_activity_logs` WRITE;
/*!40000 ALTER TABLE `role_activity_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `role_activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `role_permissions` (
  `id` varchar(191) NOT NULL,
  `roleId` varchar(191) NOT NULL,
  `permissionId` varchar(191) NOT NULL,
  `granted` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_permissions_roleId_permissionId_key` (`roleId`,`permissionId`),
  KEY `role_permissions_permissionId_fkey` (`permissionId`),
  CONSTRAINT `role_permissions_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `role_permissions_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES ('01a39eec-f0fb-44e2-a5a1-07ef5fed64b5','4f8f5e73-fa65-4741-b722-572037bd475c','4ea8788e-02b8-4035-b810-adc41830c634',1,'2026-07-04 06:46:04.074'),('0212ab3f-5903-4a85-b4c7-bae93bb6b394','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','e514356e-31c2-4608-8685-2765c3a54dd1',1,'2026-07-04 06:46:03.963'),('022c5ab2-8165-4173-a580-8951ced1e0b7','3dae0f27-ddea-41d1-9239-b88936b4d9ff','0ef90aa2-2f9e-4034-b621-5976ab579831',1,'2026-07-04 06:46:04.147'),('02b662dc-2dfa-4de2-b64d-12ef80b2cf6f','4f8f5e73-fa65-4741-b722-572037bd475c','9aa3e079-0991-4090-a668-e4536e08ee11',1,'2026-07-04 06:46:04.074'),('032a9b5c-b466-48ba-9c53-907e7aeed269','257ce300-1df9-4aa6-8dae-26cc650c7d02','2224313d-808d-4e97-93e7-e74fdc4004d6',1,'2026-07-04 06:46:03.982'),('069182f9-6b6f-417d-929c-4a2e773471da','257ce300-1df9-4aa6-8dae-26cc650c7d02','7098474d-2000-45cf-ba57-55ff19ef1ef0',1,'2026-07-04 06:46:03.982'),('07a7e812-b8fd-418f-b1cb-a75a0d53d9cf','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','926c8379-2fba-4f09-9f3d-c525d5c55165',1,'2026-07-04 06:46:03.963'),('0a718c9f-9d13-4b72-b2c6-0039207d3b9e','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','3f4f335b-1cdb-49df-83ab-d7c73898c6ca',1,'2026-07-04 06:46:03.996'),('0c3ebf44-d8c0-44e8-a7c8-9211c18e0d13','3a8de922-921f-495d-88ee-b42b2a28fef5','9aa3e079-0991-4090-a668-e4536e08ee11',1,'2026-07-04 06:46:04.018'),('0d075bba-1614-43da-a6a9-9ca694bf419e','ce438c68-8553-48c3-9324-cf11a7a4ea93','705c31eb-76aa-47d7-ae19-43f68a2ef14c',1,'2026-07-04 06:46:04.037'),('0d8309b6-124b-4b7e-9812-335ae41eb51b','3a8de922-921f-495d-88ee-b42b2a28fef5','bb54868e-b495-4a85-b857-1c1100c94fbd',1,'2026-07-04 06:46:04.018'),('0f120d5d-8034-4f02-856a-0b90c4c69d68','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','9c27177c-315a-4d57-9b8e-32a9d46134ab',1,'2026-07-04 06:46:03.963'),('0f2d637e-f46e-4c00-9b72-7d55360a1b40','7b630878-0f4b-43c5-88c1-e3b85f20fbd8','37c8a5b7-febd-454b-8f18-d98a5a6c0fe2',1,'2026-07-04 06:46:04.048'),('0f4cb08a-d217-445b-b1c5-f7d2d1d08d38','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','6f00eb53-f115-4265-9dbb-fb66afa4992a',1,'2026-07-04 06:46:03.963'),('0fc49eeb-f8c6-4110-b864-443980f5a082','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','a970135e-110c-45b5-a3b1-41de30ac1eb2',1,'2026-07-04 06:46:03.963'),('10b060fd-85a9-438f-b1b7-be8766dced2d','03e40d7d-d45d-45ef-a13d-06a3a208e95c','ecd1ad5b-58cc-4be3-a707-4dd39a25f4dd',1,'2026-07-04 06:46:04.028'),('10d69975-fa5d-4b70-820d-e69cea50910c','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','b4cf4220-d8e9-4b7b-8b2c-56ef1f65f5ee',1,'2026-07-04 06:46:03.996'),('1111d6e1-5e15-4570-bb8d-b26d3d97a7a9','257ce300-1df9-4aa6-8dae-26cc650c7d02','d6185005-04b1-4ae3-b94d-929e80f2c8e4',1,'2026-07-04 06:46:03.982'),('1215e902-4458-4d79-8bc4-1ac15758bf4f','3a8de922-921f-495d-88ee-b42b2a28fef5','b9243c66-8055-43aa-8fb5-251de4586fee',1,'2026-07-04 06:46:04.018'),('1426d64f-05f3-4dcc-9f40-488380f83b52','257ce300-1df9-4aa6-8dae-26cc650c7d02','1e7d4627-e3fd-4d78-82b0-51b0a882fc96',1,'2026-07-04 06:46:03.982'),('165d305a-7a37-4c80-8e34-196b6100c0c5','9431b553-1c23-4780-bc1d-c85abace7d61','2efe2986-702f-477f-b4a9-1d283c3c1ddc',1,'2026-07-04 06:46:04.131'),('17aa6d95-27a6-491a-886f-b71a486daa57','04278d5a-b6bf-4901-8b87-78b92b913602','5a21fa1c-22c0-4191-b5aa-bf5f4b4e7da9',1,'2026-07-04 06:46:04.007'),('17cf43e0-18d0-447b-983a-222d13d8bf40','3a8de922-921f-495d-88ee-b42b2a28fef5','2224313d-808d-4e97-93e7-e74fdc4004d6',1,'2026-07-04 06:46:04.018'),('1889d526-d63a-423e-9d82-5bf574fea0e3','257ce300-1df9-4aa6-8dae-26cc650c7d02','3b778fe3-98d7-4d1e-8df1-ceec166a0b20',1,'2026-07-04 06:46:03.982'),('1a4eeae2-63c3-4cdb-beb4-595b052ba6c0','13552ca5-b9b8-47ef-bdec-6bc60ae68c17','2efe2986-702f-477f-b4a9-1d283c3c1ddc',1,'2026-07-04 06:46:04.100'),('1bb82246-9ca8-4bc3-b97c-ec0fa3660718','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','9aa3e079-0991-4090-a668-e4536e08ee11',1,'2026-07-04 06:46:03.996'),('1cb0af4f-d0a0-4819-9708-8ac86f48dca0','257ce300-1df9-4aa6-8dae-26cc650c7d02','fa46e516-2562-4175-b865-51228f09f365',1,'2026-07-04 06:46:03.982'),('1cc0a501-ee77-45c3-8e43-db0b3a88350e','04278d5a-b6bf-4901-8b87-78b92b913602','4ea8788e-02b8-4035-b810-adc41830c634',1,'2026-07-04 06:46:04.007'),('1d06a188-67ce-4f81-9a42-870151236c93','04278d5a-b6bf-4901-8b87-78b92b913602','7a8be1b6-c030-4300-8d4d-9bbf84df1183',1,'2026-07-04 06:46:04.007'),('1f69a3a2-83ea-438d-b8d3-4ec95c489cfd','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','c23f4c80-952b-4378-9dd5-b095c35d2398',1,'2026-07-04 06:46:03.963'),('2049c0c7-2451-432b-a441-61664920f6d3','257ce300-1df9-4aa6-8dae-26cc650c7d02','212696d3-f656-42de-9cdf-35ed9da4d3b6',1,'2026-07-04 06:46:03.982'),('20c65f84-c58d-4d12-b59b-9ce8b49219b1','03e40d7d-d45d-45ef-a13d-06a3a208e95c','e8284b2c-0d6e-4c9a-9cbd-1d2839e7c39d',1,'2026-07-04 06:46:04.028'),('21d46a91-9f0d-4eec-81a1-1ffd4bcc4edb','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','433a7843-b7f6-42d1-82f0-d7164aeb2b69',1,'2026-07-04 06:46:03.963'),('230b1f8d-7ba3-4b8c-a1dd-7a15cdc96440','257ce300-1df9-4aa6-8dae-26cc650c7d02','768e7fac-7830-4d77-9b3a-688307163d51',1,'2026-07-04 06:46:03.982'),('23184cb1-9f1c-4d74-a56d-f3d649003eb9','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','8b9ceb8b-b3ee-47df-b704-85adbecc8fdd',1,'2026-07-04 06:46:03.963'),('233ea633-872b-4723-a901-f6be581f7afb','df91281b-437f-47f1-af5c-62e387302b3b','0ef90aa2-2f9e-4034-b621-5976ab579831',1,'2026-07-04 06:46:04.123'),('249f4994-d202-4b8b-b0f4-5b7c252b8f42','03e40d7d-d45d-45ef-a13d-06a3a208e95c','f9b149d0-30c7-4cf2-a1ce-e0ec2d92bd69',1,'2026-07-04 06:46:04.028'),('25b216eb-d454-475c-9e66-1a9fd81b9561','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','bd548451-7f7a-400e-98a3-74bcf364500f',1,'2026-07-04 06:46:03.996'),('28ade731-815e-4dd5-9d6b-b96c107408df','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','93a79d42-1a2c-420d-a12e-cf8260ed2508',1,'2026-07-04 06:46:03.963'),('28c0f1ea-80dd-4ccb-ba3e-5547bd40f0e0','4f8f5e73-fa65-4741-b722-572037bd475c','7a8be1b6-c030-4300-8d4d-9bbf84df1183',1,'2026-07-04 06:46:04.074'),('28ca0bbf-4432-4ca4-8fb4-d613a2eff30d','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','a58d610e-fb56-41bb-9dde-e52a4fd36d9e',1,'2026-07-04 06:46:03.963'),('29570e94-96b4-49b6-98d8-91879d9dedc3','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','b103d9c8-f64a-4849-b4d8-512b57006d10',1,'2026-07-04 06:46:03.996'),('297b9934-1d9b-436b-b25c-7672361d4b44','257ce300-1df9-4aa6-8dae-26cc650c7d02','539f6f2c-eb43-4126-8a3a-513ebe1acf7e',1,'2026-07-04 06:46:03.982'),('2d140cba-c29f-4243-9597-ef44f244bc01','03e40d7d-d45d-45ef-a13d-06a3a208e95c','85edbe0d-c7cd-4bf0-8062-9ac11a39c1fe',1,'2026-07-04 06:46:04.028'),('2e2ec203-00af-44ec-bee0-3a2d528e5a37','257ce300-1df9-4aa6-8dae-26cc650c7d02','b2ecc664-496a-4f5e-b9d9-81514250b271',1,'2026-07-04 06:46:03.982'),('30fca32c-c728-4530-b841-5b0588e24e5b','257ce300-1df9-4aa6-8dae-26cc650c7d02','705c31eb-76aa-47d7-ae19-43f68a2ef14c',1,'2026-07-04 06:46:03.982'),('316f7daa-c104-4c8e-9b95-421ee6fa96fb','03e40d7d-d45d-45ef-a13d-06a3a208e95c','9aa3e079-0991-4090-a668-e4536e08ee11',1,'2026-07-04 06:46:04.028'),('3192dd7b-1778-4b7c-8ce1-64bc483fa3d9','257ce300-1df9-4aa6-8dae-26cc650c7d02','caf667fe-4599-40ce-b370-74de83bb11db',1,'2026-07-04 06:46:03.982'),('329b71a6-ca35-42b2-b123-0e4203686019','04278d5a-b6bf-4901-8b87-78b92b913602','56fc2eb8-467c-4ec2-8fe3-124fa2423949',1,'2026-07-04 06:46:04.007'),('3326827b-50f8-4b2b-8716-a4675146899e','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','dc5a2fe1-0533-445b-ab70-bcd7597c9887',1,'2026-07-04 06:46:03.963'),('3436df47-4d62-4a83-8623-9c41d6b13328','5960d863-3437-4388-a909-06dd0fa180e4','d1bbcc34-2e47-47f5-9d04-c3fc1e666c02',1,'2026-07-04 06:46:04.107'),('345d5c5e-ad6d-40c0-946b-8fcf02d00dec','3a8de922-921f-495d-88ee-b42b2a28fef5','d6185005-04b1-4ae3-b94d-929e80f2c8e4',1,'2026-07-04 06:46:04.018'),('34ca86da-3c0f-470e-8554-7bdf48bfbc36','3a8de922-921f-495d-88ee-b42b2a28fef5','705c31eb-76aa-47d7-ae19-43f68a2ef14c',1,'2026-07-04 06:46:04.018'),('34fdec16-902f-4f49-9674-db3b8b63cff2','4ad8335e-585e-4d31-a59f-2c8c82e310ed','0bb2f826-6845-4973-9c79-9f0a3f78bec3',1,'2026-07-04 06:46:04.092'),('35eb83c0-fc1e-47a3-9933-7043924e0a43','04278d5a-b6bf-4901-8b87-78b92b913602','0bb2f826-6845-4973-9c79-9f0a3f78bec3',1,'2026-07-04 06:46:04.007'),('363794c4-17b1-4690-a9c6-b571af6c4f03','257ce300-1df9-4aa6-8dae-26cc650c7d02','858d9235-869e-48fa-ac0c-06ec23a3af7b',1,'2026-07-04 06:46:03.982'),('363b6928-0d62-4880-9eda-f782cb03710b','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','0bb2f826-6845-4973-9c79-9f0a3f78bec3',1,'2026-07-04 06:46:03.996'),('36412a24-5b40-4d80-beae-7dc6d4630f45','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','bb54868e-b495-4a85-b857-1c1100c94fbd',1,'2026-07-04 06:46:03.996'),('37862231-a73f-423a-9f29-093f0bb71275','257ce300-1df9-4aa6-8dae-26cc650c7d02','f43d6f6b-dbee-4678-abd2-615711392bbb',1,'2026-07-04 06:46:03.982'),('37ba9786-77a3-43cf-a91c-65993aeb9d85','04278d5a-b6bf-4901-8b87-78b92b913602','f5366c15-ee08-44a4-b8dd-882ab7fffe32',1,'2026-07-04 06:46:04.007'),('37f47f4d-2239-48c3-a9f1-68f0f4ec9cdd','3dae0f27-ddea-41d1-9239-b88936b4d9ff','c23f4c80-952b-4378-9dd5-b095c35d2398',1,'2026-07-04 06:46:04.147'),('397e337b-e563-4a1e-ad1c-c85cb882ea5e','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','f9b149d0-30c7-4cf2-a1ce-e0ec2d92bd69',1,'2026-07-04 06:46:03.963'),('39d8c050-4e24-40eb-bf27-f3110d29fbf0','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','56fc2eb8-467c-4ec2-8fe3-124fa2423949',1,'2026-07-04 06:46:03.996'),('3a6aa190-bc3e-4e32-94c4-929c4eb0de50','257ce300-1df9-4aa6-8dae-26cc650c7d02','0ef90aa2-2f9e-4034-b621-5976ab579831',1,'2026-07-04 06:46:03.982'),('3c3fff05-ff2b-4fcf-976c-473ac6ab6892','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','caf667fe-4599-40ce-b370-74de83bb11db',1,'2026-07-04 06:46:03.963'),('3dae02c0-dd05-4135-90a0-973acf51fc34','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','787727d2-5f99-4a84-9d01-df473a7cc207',1,'2026-07-04 06:46:03.963'),('3df4ad31-4c14-4b59-9aa1-c8ad56c81d7e','257ce300-1df9-4aa6-8dae-26cc650c7d02','0f1fc73d-184f-4e9b-8e84-b613eecb86ad',1,'2026-08-12 05:35:49.960'),('3df756db-286e-45a4-b792-4af1cea5e2dc','04278d5a-b6bf-4901-8b87-78b92b913602','8b28fa52-316b-456a-85c1-6393e2d8a0dc',1,'2026-07-04 06:46:04.007'),('3f52624b-f6ab-4ecc-9c50-22de36775dac','04278d5a-b6bf-4901-8b87-78b92b913602','b103d9c8-f64a-4849-b4d8-512b57006d10',1,'2026-07-04 06:46:04.007'),('3f7831c9-5651-4fc1-8ad5-1f5c187ab5bd','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','539f6f2c-eb43-4126-8a3a-513ebe1acf7e',1,'2026-07-04 06:46:03.963'),('3f83fed8-69c2-444e-8de1-22bd37d5091c','4f8f5e73-fa65-4741-b722-572037bd475c','e8284b2c-0d6e-4c9a-9cbd-1d2839e7c39d',1,'2026-07-04 06:46:04.074'),('3fbc150d-9673-462f-b62a-938a8344a001','257ce300-1df9-4aa6-8dae-26cc650c7d02','e6900af0-3403-42a7-9dde-ec10f06015b4',1,'2026-07-04 06:46:03.982'),('400b21ff-8ca7-4c8f-877b-3005f38ac6eb','4b8f5ef8-05f6-49e3-ae90-c56fc28b7fd5','bb54868e-b495-4a85-b857-1c1100c94fbd',1,'2026-07-04 06:46:04.084'),('40427435-423e-43d6-aea4-1e81eec71aa2','04278d5a-b6bf-4901-8b87-78b92b913602','93a79d42-1a2c-420d-a12e-cf8260ed2508',1,'2026-07-04 06:46:04.007'),('4064943b-0b44-486b-9726-1f80e7163cb5','7e38ee05-bcd0-4395-ab59-2aa6c72c05d4','6e1d9cf9-e0e9-44b0-909d-1d7dff1af0b3',1,'2026-07-04 06:46:04.115'),('40925fbd-f91f-47bd-9c7f-3ce2b2b27da9','3a8de922-921f-495d-88ee-b42b2a28fef5','7a8be1b6-c030-4300-8d4d-9bbf84df1183',1,'2026-07-04 06:46:04.018'),('41115281-99ab-4a7e-9e37-2c4bf49c8658','3dae0f27-ddea-41d1-9239-b88936b4d9ff','0bb2f826-6845-4973-9c79-9f0a3f78bec3',1,'2026-07-04 06:46:04.147'),('41c2b091-ffab-46ae-851c-ceaa86b83f58','0b21d5ec-c1d7-4aa2-89fa-b7fe2438c4de','5976cdd7-cfc5-4015-8660-01e49a2a996c',1,'2026-07-04 06:46:04.056'),('41c56a01-9c98-4adc-9721-53f05ccc5404','03e40d7d-d45d-45ef-a13d-06a3a208e95c','9c27177c-315a-4d57-9b8e-32a9d46134ab',1,'2026-07-04 06:46:04.028'),('41e6a371-9c7e-472d-b8fc-815f73c2c5b4','3a8de922-921f-495d-88ee-b42b2a28fef5','d1bbcc34-2e47-47f5-9d04-c3fc1e666c02',1,'2026-07-04 06:46:04.018'),('41f1baec-1751-4c79-83d0-b02ffa5df493','7b630878-0f4b-43c5-88c1-e3b85f20fbd8','467a5493-3fd3-48c7-90c2-0bf3bf616b68',1,'2026-07-04 06:46:04.048'),('42265ae5-1530-42b6-a09e-100c7e4815e8','257ce300-1df9-4aa6-8dae-26cc650c7d02','5976cdd7-cfc5-4015-8660-01e49a2a996c',1,'2026-07-04 06:46:03.982'),('42bb56be-c4aa-4e9a-930e-00bf02dc5b8f','04278d5a-b6bf-4901-8b87-78b92b913602','b4cf4220-d8e9-4b7b-8b2c-56ef1f65f5ee',1,'2026-07-04 06:46:04.007'),('42bd82ab-84e8-401a-8b44-31df6a2e7753','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','212696d3-f656-42de-9cdf-35ed9da4d3b6',1,'2026-07-04 06:46:03.963'),('43f7c433-59a2-42bc-a3a7-738d0422c495','04278d5a-b6bf-4901-8b87-78b92b913602','e514356e-31c2-4608-8685-2765c3a54dd1',1,'2026-07-04 06:46:04.007'),('4421a180-d75d-4393-84b9-76ebee30982e','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','0bb2f826-6845-4973-9c79-9f0a3f78bec3',1,'2026-07-04 06:46:03.963'),('45664311-c8d6-4a02-83df-04bab200bd32','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','9c27177c-315a-4d57-9b8e-32a9d46134ab',1,'2026-07-04 06:46:03.996'),('45e9fa62-9b91-41a6-96b9-04763db56b9c','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','f5366c15-ee08-44a4-b8dd-882ab7fffe32',1,'2026-07-04 06:46:03.996'),('469738f8-0dc3-49a6-a6eb-29d38e7dd44a','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','5a21fa1c-22c0-4191-b5aa-bf5f4b4e7da9',1,'2026-07-04 06:46:03.963'),('474e53d0-abbf-40f5-9a52-2e3b84367e0a','3a8de922-921f-495d-88ee-b42b2a28fef5','b103d9c8-f64a-4849-b4d8-512b57006d10',1,'2026-07-04 06:46:04.018'),('475e0985-4ff7-4472-bbca-dcc237f6b9e8','257ce300-1df9-4aa6-8dae-26cc650c7d02','e8284b2c-0d6e-4c9a-9cbd-1d2839e7c39d',1,'2026-07-04 06:46:03.982'),('47a227e3-ad27-4202-8fd2-3008148a1096','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','fb3ec72c-7716-488c-b5c9-c0c7970f1de7',1,'2026-07-04 06:46:03.963'),('480a45ef-77a1-4ba0-af9d-77491d7b4a20','13552ca5-b9b8-47ef-bdec-6bc60ae68c17','2224313d-808d-4e97-93e7-e74fdc4004d6',1,'2026-07-04 06:46:04.100'),('48201f42-ccbd-4b3b-86fa-3a648666fadc','257ce300-1df9-4aa6-8dae-26cc650c7d02','6f00eb53-f115-4265-9dbb-fb66afa4992a',1,'2026-07-04 06:46:03.982'),('489658b6-65ca-468c-a829-743f7e3a5ff8','04278d5a-b6bf-4901-8b87-78b92b913602','366b0757-7dac-4f20-98ea-97a62920f4c1',1,'2026-07-04 06:46:04.007'),('492001e7-86e8-4ed3-afec-6bb2b9e9e0a1','4b8f5ef8-05f6-49e3-ae90-c56fc28b7fd5','e8284b2c-0d6e-4c9a-9cbd-1d2839e7c39d',1,'2026-07-04 06:46:04.084'),('4ab9fd84-0a3b-4c64-996a-e9944d0263ed','4ad8335e-585e-4d31-a59f-2c8c82e310ed','eb71a17a-58ed-4295-97a1-e7416c4c3e7d',1,'2026-07-04 06:46:04.092'),('4c618254-c3c5-4176-af29-7f01075d5404','04278d5a-b6bf-4901-8b87-78b92b913602','3b778fe3-98d7-4d1e-8df1-ceec166a0b20',1,'2026-07-04 06:46:04.007'),('4c702fae-9518-40cd-8d43-89be0029938e','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','37c8a5b7-febd-454b-8f18-d98a5a6c0fe2',1,'2026-07-04 06:46:03.996'),('4c727346-c9d3-488a-9222-c6c9d8d04b49','257ce300-1df9-4aa6-8dae-26cc650c7d02','e514356e-31c2-4608-8685-2765c3a54dd1',1,'2026-07-04 06:46:03.982'),('4cf8be07-e3bc-4047-a3bc-f3f8a4fd1ee2','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','7098474d-2000-45cf-ba57-55ff19ef1ef0',1,'2026-07-04 06:46:03.996'),('4d0cba5d-3b98-49ca-9ab8-e2d93a2bd1e5','4f8f5e73-fa65-4741-b722-572037bd475c','b2ecc664-496a-4f5e-b9d9-81514250b271',1,'2026-07-04 06:46:04.074'),('4ddd574c-7309-45f8-b48b-2a8b0d050e48','ce438c68-8553-48c3-9324-cf11a7a4ea93','7098474d-2000-45cf-ba57-55ff19ef1ef0',1,'2026-07-04 06:46:04.037'),('4e3a4ac4-4808-4b90-be85-366726022148','257ce300-1df9-4aa6-8dae-26cc650c7d02','467a5493-3fd3-48c7-90c2-0bf3bf616b68',1,'2026-07-04 06:46:03.982'),('4f416fa7-856a-4c16-a51a-bdea3f9a9a1e','257ce300-1df9-4aa6-8dae-26cc650c7d02','85edbe0d-c7cd-4bf0-8062-9ac11a39c1fe',1,'2026-07-04 06:46:03.982'),('51b18d5b-44d4-4f99-9d57-e312f4137907','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','86ed4d02-863f-4ee9-a54a-45cadc6a9cfb',1,'2026-07-04 06:46:03.996'),('522b033f-e2ac-48a4-b74f-adc0bbb7a772','03e40d7d-d45d-45ef-a13d-06a3a208e95c','bb54868e-b495-4a85-b857-1c1100c94fbd',1,'2026-07-04 06:46:04.028'),('527a1610-8d77-4b89-9da7-1eaf3adc466a','3a8de922-921f-495d-88ee-b42b2a28fef5','86ed4d02-863f-4ee9-a54a-45cadc6a9cfb',1,'2026-07-04 06:46:04.018'),('528d3c22-d1fc-40ca-a83f-185db423e315','fa1c94f0-e217-4903-bfc7-ac56c1d6cbd8','d1bbcc34-2e47-47f5-9d04-c3fc1e666c02',1,'2026-07-04 06:46:04.138'),('529a034d-c367-4d23-a4bd-ff97dec81563','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','b2ecc664-496a-4f5e-b9d9-81514250b271',1,'2026-07-04 06:46:03.963'),('5399c617-cf75-48bc-96ce-b076ad324695','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','85edbe0d-c7cd-4bf0-8062-9ac11a39c1fe',1,'2026-07-04 06:46:03.996'),('53bf62e4-ef55-43c6-aad8-e8e4af85d943','257ce300-1df9-4aa6-8dae-26cc650c7d02','366b0757-7dac-4f20-98ea-97a62920f4c1',1,'2026-07-04 06:46:03.982'),('548e916c-42eb-4e5a-9d31-dce20015c209','ce438c68-8553-48c3-9324-cf11a7a4ea93','5a21fa1c-22c0-4191-b5aa-bf5f4b4e7da9',1,'2026-07-04 06:46:04.037'),('55f8800b-30a5-4a37-be55-a8cbf9d340c5','4ad8335e-585e-4d31-a59f-2c8c82e310ed','bb54868e-b495-4a85-b857-1c1100c94fbd',1,'2026-07-04 06:46:04.092'),('568bb5c2-d33a-4b0a-9792-2dc41bfe0c46','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','d67c4e22-65af-4450-a934-86965fc74bd6',1,'2026-07-04 06:46:03.996'),('56bb8815-896e-456c-9944-e9bc5e4dd8f6','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','fb3ec72c-7716-488c-b5c9-c0c7970f1de7',1,'2026-07-04 06:46:03.996'),('56fb232e-3a72-4c9e-83ac-4e62af6357ce','257ce300-1df9-4aa6-8dae-26cc650c7d02','3e7d6a13-f531-4269-826c-a934ec04e049',1,'2026-07-04 06:46:03.982'),('57fdb0c1-fc7b-4630-9c5b-ab5b51f76cbb','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','caf667fe-4599-40ce-b370-74de83bb11db',1,'2026-07-04 06:46:03.996'),('58552825-d2f9-48d4-9fad-582c0899ce3e','7b630878-0f4b-43c5-88c1-e3b85f20fbd8','3b778fe3-98d7-4d1e-8df1-ceec166a0b20',1,'2026-07-04 06:46:04.048'),('58cba5b8-3fbc-402b-962b-29fe9be1e810','3a8de922-921f-495d-88ee-b42b2a28fef5','56fc2eb8-467c-4ec2-8fe3-124fa2423949',1,'2026-07-04 06:46:04.018'),('58f7b7d2-a4c1-4e2e-b21b-36f25372190f','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','e8284b2c-0d6e-4c9a-9cbd-1d2839e7c39d',1,'2026-07-04 06:46:03.996'),('598d35cb-d84f-4159-8064-35333dc58c95','257ce300-1df9-4aa6-8dae-26cc650c7d02','37c8a5b7-febd-454b-8f18-d98a5a6c0fe2',1,'2026-07-04 06:46:03.982'),('5a05f547-f2bb-4021-a3d1-cc97c291d1f3','04278d5a-b6bf-4901-8b87-78b92b913602','d6185005-04b1-4ae3-b94d-929e80f2c8e4',1,'2026-07-04 06:46:04.007'),('5b1bc4c6-5d89-4a00-9ccf-88d49395bc66','03e40d7d-d45d-45ef-a13d-06a3a208e95c','d1bbcc34-2e47-47f5-9d04-c3fc1e666c02',1,'2026-07-04 06:46:04.028'),('5bb2a181-1afc-4dc0-9b75-911f4196eb98','257ce300-1df9-4aa6-8dae-26cc650c7d02','d57c15fa-3e12-41d1-ac56-80c3d3cdd477',1,'2026-07-04 06:46:03.982'),('5bdef03d-b56a-4e15-868b-0a1a29913ea9','257ce300-1df9-4aa6-8dae-26cc650c7d02','eb71a17a-58ed-4295-97a1-e7416c4c3e7d',1,'2026-07-04 06:46:03.982'),('5c004333-bef2-4daf-a970-72e3ad45d7bb','03e40d7d-d45d-45ef-a13d-06a3a208e95c','433a7843-b7f6-42d1-82f0-d7164aeb2b69',1,'2026-07-04 06:46:04.028'),('5c179e6a-f791-49f8-ae00-2819d96cd501','257ce300-1df9-4aa6-8dae-26cc650c7d02','b103d9c8-f64a-4849-b4d8-512b57006d10',1,'2026-07-04 06:46:03.982'),('5cc27f4a-de62-4774-9e24-15f3df298a96','3a8de922-921f-495d-88ee-b42b2a28fef5','9c27177c-315a-4d57-9b8e-32a9d46134ab',1,'2026-07-04 06:46:04.018'),('5dbc380b-e718-4cf0-bc1e-02c5367cacb6','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','f43d6f6b-dbee-4678-abd2-615711392bbb',1,'2026-07-04 06:46:03.996'),('5dfc42af-1ed8-4043-9cc0-f2d825007467','3a8de922-921f-495d-88ee-b42b2a28fef5','e514356e-31c2-4608-8685-2765c3a54dd1',1,'2026-07-04 06:46:04.018'),('5e7d0ee2-6f7a-478e-a98a-40cf363c3f25','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','b7f9fd17-162e-4164-8ed7-20f983edd3bb',1,'2026-07-04 06:46:03.996'),('5f1c4e4a-ddfe-4445-bf0c-5f8f45ead61d','257ce300-1df9-4aa6-8dae-26cc650c7d02','787727d2-5f99-4a84-9d01-df473a7cc207',1,'2026-07-04 06:46:03.982'),('612d498a-e23d-447d-be5a-11832604b72e','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','fa46e516-2562-4175-b865-51228f09f365',1,'2026-07-04 06:46:03.963'),('62f269b3-a1c2-4be7-a47c-664dac8a6e04','04278d5a-b6bf-4901-8b87-78b92b913602','9c27177c-315a-4d57-9b8e-32a9d46134ab',1,'2026-07-04 06:46:04.007'),('63d801c2-b8fb-4657-b874-1f50708e0a4e','257ce300-1df9-4aa6-8dae-26cc650c7d02','8950992f-2e27-40d5-9657-d26cd31a19c6',1,'2026-07-04 06:46:03.982'),('63e666a4-931e-4f28-a8c9-86f85e248e03','3a8de922-921f-495d-88ee-b42b2a28fef5','85edbe0d-c7cd-4bf0-8062-9ac11a39c1fe',1,'2026-07-04 06:46:04.018'),('64523b2d-bee6-40e6-a677-357ddb1bbdbb','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','e8284b2c-0d6e-4c9a-9cbd-1d2839e7c39d',1,'2026-07-04 06:46:03.963'),('6690b79a-6b16-4bac-a8d7-9ffd66f67beb','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','7a8be1b6-c030-4300-8d4d-9bbf84df1183',1,'2026-07-04 06:46:03.963'),('687a07a9-44af-4305-a52b-04436a0baa7c','3a8de922-921f-495d-88ee-b42b2a28fef5','caf667fe-4599-40ce-b370-74de83bb11db',1,'2026-07-04 06:46:04.018'),('68f9aea8-fddc-402f-9220-f3910373d5ab','257ce300-1df9-4aa6-8dae-26cc650c7d02','b4cf4220-d8e9-4b7b-8b2c-56ef1f65f5ee',1,'2026-07-04 06:46:03.982'),('69490fa4-8310-48bd-9c37-8ff22cee0656','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','b9243c66-8055-43aa-8fb5-251de4586fee',1,'2026-07-04 06:46:03.963'),('6a566294-febc-4b7d-aacf-3a546ca3dabf','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','d6185005-04b1-4ae3-b94d-929e80f2c8e4',1,'2026-07-04 06:46:03.963'),('6aa03bdd-6ab2-4eed-9145-1699a5810e10','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','d67c4e22-65af-4450-a934-86965fc74bd6',1,'2026-07-04 06:46:03.963'),('6ae998c0-667e-4de1-b45f-5fa88c3f055b','4f8f5e73-fa65-4741-b722-572037bd475c','b103d9c8-f64a-4849-b4d8-512b57006d10',1,'2026-07-04 06:46:04.074'),('6af609c8-8691-41d4-95ac-95389a14ad74','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','5a21fa1c-22c0-4191-b5aa-bf5f4b4e7da9',1,'2026-07-04 06:46:03.996'),('6b990fd5-852c-4b9b-b5e5-38d9627d9fb5','04278d5a-b6bf-4901-8b87-78b92b913602','2efe2986-702f-477f-b4a9-1d283c3c1ddc',1,'2026-07-04 06:46:04.007'),('6bba178a-d535-4394-9840-e1fc62226137','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','7098474d-2000-45cf-ba57-55ff19ef1ef0',1,'2026-07-04 06:46:03.963'),('6ce6613d-ce77-41c3-a622-3f61b29cda7e','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','e514356e-31c2-4608-8685-2765c3a54dd1',1,'2026-07-04 06:46:03.996'),('6dc77dc3-fc57-4c62-aa83-32e978ca8234','257ce300-1df9-4aa6-8dae-26cc650c7d02','48d7b224-37bf-4092-8e2b-92938af744e7',1,'2026-07-04 06:46:03.982'),('6dedc31c-f8cb-4e95-91e6-3b74df1ce8dd','257ce300-1df9-4aa6-8dae-26cc650c7d02','5a21fa1c-22c0-4191-b5aa-bf5f4b4e7da9',1,'2026-07-04 06:46:03.982'),('6eaadba1-ba20-4fb0-a987-3acc3643e592','3a8de922-921f-495d-88ee-b42b2a28fef5','f9b149d0-30c7-4cf2-a1ce-e0ec2d92bd69',1,'2026-07-04 06:46:04.018'),('6ef0f78b-c2d2-40aa-a65e-ea66c8e9b71a','3a8de922-921f-495d-88ee-b42b2a28fef5','eb71a17a-58ed-4295-97a1-e7416c4c3e7d',1,'2026-07-04 06:46:04.018'),('6f0e6bf3-358c-4be5-a476-49924a019f1e','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','787727d2-5f99-4a84-9d01-df473a7cc207',1,'2026-07-04 06:46:03.996'),('6fb4d529-1c74-45fa-9b12-930d261a902f','4f8f5e73-fa65-4741-b722-572037bd475c','fb3ec72c-7716-488c-b5c9-c0c7970f1de7',1,'2026-07-04 06:46:04.074'),('707973ff-48fb-46e9-ab40-97bd78739be0','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','705c31eb-76aa-47d7-ae19-43f68a2ef14c',1,'2026-07-04 06:46:03.996'),('70ab6a73-f23f-4fc1-aefa-23b99ea9a0de','4f8f5e73-fa65-4741-b722-572037bd475c','bd548451-7f7a-400e-98a3-74bcf364500f',1,'2026-07-04 06:46:04.074'),('70ad15ab-e477-4f35-806c-5c13471ca77b','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','d1bbcc34-2e47-47f5-9d04-c3fc1e666c02',1,'2026-07-04 06:46:03.996'),('712b18e0-2676-44f5-a46a-f53854b4e007','257ce300-1df9-4aa6-8dae-26cc650c7d02','4ea8788e-02b8-4035-b810-adc41830c634',1,'2026-07-04 06:46:03.982'),('732a0121-0996-4026-a4d7-0941ad0e4477','4ad8335e-585e-4d31-a59f-2c8c82e310ed','f5366c15-ee08-44a4-b8dd-882ab7fffe32',1,'2026-07-04 06:46:04.092'),('733ba594-ff17-4f18-9d59-764e302636a5','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','85edbe0d-c7cd-4bf0-8062-9ac11a39c1fe',1,'2026-07-04 06:46:03.963'),('738ed6f9-3f15-4685-aaad-78b008cbfddd','3a8de922-921f-495d-88ee-b42b2a28fef5','b2ecc664-496a-4f5e-b9d9-81514250b271',1,'2026-07-04 06:46:04.018'),('739cbb02-ef5f-4a32-adc6-540e1e6226be','257ce300-1df9-4aa6-8dae-26cc650c7d02','926c8379-2fba-4f09-9f3d-c525d5c55165',1,'2026-07-04 06:46:03.982'),('7442cb17-b95f-4af8-985c-537f3fbe04cc','3dae0f27-ddea-41d1-9239-b88936b4d9ff','2224313d-808d-4e97-93e7-e74fdc4004d6',1,'2026-07-04 06:46:04.147'),('74a94f40-ca18-42ed-8be0-fb6f197252c8','04278d5a-b6bf-4901-8b87-78b92b913602','bb54868e-b495-4a85-b857-1c1100c94fbd',1,'2026-07-04 06:46:04.007'),('766f987e-cbbd-44d3-aab3-99890fad0661','5960d863-3437-4388-a909-06dd0fa180e4','85edbe0d-c7cd-4bf0-8062-9ac11a39c1fe',1,'2026-07-04 06:46:04.107'),('76b5bce1-5f54-477f-a347-3c2866415088','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','48d7b224-37bf-4092-8e2b-92938af744e7',1,'2026-07-04 06:46:03.963'),('778e14c7-b7ad-4a2e-aade-da67ed3fdc7e','257ce300-1df9-4aa6-8dae-26cc650c7d02','2061e10d-a31d-414f-9888-6dcd1f726a6c',1,'2026-07-04 06:46:03.982'),('7a0cb4b6-3d9a-4a9e-b820-6658ba9066ce','257ce300-1df9-4aa6-8dae-26cc650c7d02','f9b149d0-30c7-4cf2-a1ce-e0ec2d92bd69',1,'2026-07-04 06:46:03.982'),('7ab0e663-9e52-4e39-91a1-e31cd5432366','03e40d7d-d45d-45ef-a13d-06a3a208e95c','fb3ec72c-7716-488c-b5c9-c0c7970f1de7',1,'2026-07-04 06:46:04.028'),('7bb5b19a-056c-4fad-a850-43244f33d12e','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','4ea8788e-02b8-4035-b810-adc41830c634',1,'2026-07-04 06:46:03.963'),('7dc3645a-ba95-4e77-b38d-c6898a7b6298','257ce300-1df9-4aa6-8dae-26cc650c7d02','bd548451-7f7a-400e-98a3-74bcf364500f',1,'2026-07-04 06:46:03.982'),('7e6c5efc-25af-4666-996d-18a4d608adce','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','eb71a17a-58ed-4295-97a1-e7416c4c3e7d',1,'2026-07-04 06:46:03.963'),('7ee6f18e-5925-420d-9c22-147d94a944ea','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','d610c5f0-3a25-40bf-989e-8df01eba1363',1,'2026-07-04 06:46:03.963'),('7ef289ba-423e-4e26-87eb-0b33f5aa8e16','03e40d7d-d45d-45ef-a13d-06a3a208e95c','2efe2986-702f-477f-b4a9-1d283c3c1ddc',1,'2026-07-04 06:46:04.028'),('7f6ea489-785c-49cd-9e49-ea3b2e00d90b','3dae0f27-ddea-41d1-9239-b88936b4d9ff','fb3ec72c-7716-488c-b5c9-c0c7970f1de7',1,'2026-07-04 06:46:04.147'),('8070d7cd-0f9a-4652-9c72-97369af364b7','257ce300-1df9-4aa6-8dae-26cc650c7d02','fb3ec72c-7716-488c-b5c9-c0c7970f1de7',1,'2026-07-04 06:46:03.982'),('80a5db1a-8a60-45a0-a862-a40570b289e8','3a8de922-921f-495d-88ee-b42b2a28fef5','7098474d-2000-45cf-ba57-55ff19ef1ef0',1,'2026-07-04 06:46:04.018'),('80a63c70-9add-473b-a04d-22c7300db590','257ce300-1df9-4aa6-8dae-26cc650c7d02','93a79d42-1a2c-420d-a12e-cf8260ed2508',1,'2026-07-04 06:46:03.982'),('8110e12a-9559-4557-998e-23c8c85717fa','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','2efe2986-702f-477f-b4a9-1d283c3c1ddc',1,'2026-07-04 06:46:03.996'),('8134f794-7930-4a10-bb8a-a020cd5137ac','7b630878-0f4b-43c5-88c1-e3b85f20fbd8','b4cf4220-d8e9-4b7b-8b2c-56ef1f65f5ee',1,'2026-07-04 06:46:04.048'),('81a0c773-416d-4863-84cd-78a2e6ad79d2','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','926c8379-2fba-4f09-9f3d-c525d5c55165',1,'2026-07-04 06:46:03.996'),('8312c124-87d1-4bc4-8ed7-8d6483192cc6','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','4f176948-9427-41ae-af77-cfa52e30d865',1,'2026-07-04 06:46:03.963'),('83601e97-3317-4e60-96d3-036159b22e5b','03e40d7d-d45d-45ef-a13d-06a3a208e95c','705c31eb-76aa-47d7-ae19-43f68a2ef14c',1,'2026-07-04 06:46:04.028'),('84b5fdf1-2b8c-4283-90c0-c1fc829166a3','04278d5a-b6bf-4901-8b87-78b92b913602','9aa3e079-0991-4090-a668-e4536e08ee11',1,'2026-07-04 06:46:04.007'),('84f323b9-e0cb-4ea5-b3a5-8523141e0ea5','03e40d7d-d45d-45ef-a13d-06a3a208e95c','caf667fe-4599-40ce-b370-74de83bb11db',1,'2026-07-04 06:46:04.028'),('86c49edd-e6e5-4fb4-9be9-9106259acc9b','4b8f5ef8-05f6-49e3-ae90-c56fc28b7fd5','2224313d-808d-4e97-93e7-e74fdc4004d6',1,'2026-07-04 06:46:04.084'),('86f51153-c3e2-45d6-af3e-53034904e38a','257ce300-1df9-4aa6-8dae-26cc650c7d02','b9243c66-8055-43aa-8fb5-251de4586fee',1,'2026-07-04 06:46:03.982'),('88a7612f-4642-4f17-a8c8-a1af639ce74b','3dae0f27-ddea-41d1-9239-b88936b4d9ff','d1bbcc34-2e47-47f5-9d04-c3fc1e666c02',1,'2026-07-04 06:46:04.147'),('8953242d-7241-46e0-9a22-3d1cae611f08','0b21d5ec-c1d7-4aa2-89fa-b7fe2438c4de','99df5214-97ef-471a-b644-194ebf2e716a',1,'2026-07-04 06:46:04.056'),('898e6d8f-c4c3-4af3-affc-cfc23df07372','c32f4290-e8c3-4d4d-8382-a1b866d45dbb','c23f4c80-952b-4378-9dd5-b095c35d2398',1,'2026-07-04 06:46:04.066'),('8a7bccf5-46b7-4c36-b508-df8363062c8e','03e40d7d-d45d-45ef-a13d-06a3a208e95c','2224313d-808d-4e97-93e7-e74fdc4004d6',1,'2026-07-04 06:46:04.028'),('8a930fbf-e13e-46a1-a2bf-08a76b1038c3','c32f4290-e8c3-4d4d-8382-a1b866d45dbb','99df5214-97ef-471a-b644-194ebf2e716a',1,'2026-07-04 06:46:04.066'),('8bbc2507-1f47-4b3e-904a-95efb0cf6499','3dae0f27-ddea-41d1-9239-b88936b4d9ff','7a8be1b6-c030-4300-8d4d-9bbf84df1183',1,'2026-07-04 06:46:04.147'),('8bf03646-481d-4f54-86fb-a4ea9295b575','3a8de922-921f-495d-88ee-b42b2a28fef5','e8284b2c-0d6e-4c9a-9cbd-1d2839e7c39d',1,'2026-07-04 06:46:04.018'),('8cfa61b3-c1a3-4f14-a204-bc4662c78405','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','b7f9fd17-162e-4164-8ed7-20f983edd3bb',1,'2026-07-04 06:46:03.963'),('8d17f7ab-1887-46b4-a37c-2797ab5e7a19','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','6f00eb53-f115-4265-9dbb-fb66afa4992a',1,'2026-07-04 06:46:03.996'),('8d98447a-bd5c-40d5-83b1-cce3b5e4280b','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','fa46e516-2562-4175-b865-51228f09f365',1,'2026-07-04 06:46:03.996'),('8e7563dd-3652-42b6-ac56-e1c045195d67','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','8b9ceb8b-b3ee-47df-b704-85adbecc8fdd',1,'2026-07-04 06:46:03.996'),('8fab686c-3c1b-4939-b3c7-ccbcf82f9643','257ce300-1df9-4aa6-8dae-26cc650c7d02','a970135e-110c-45b5-a3b1-41de30ac1eb2',1,'2026-07-04 06:46:03.982'),('8fda070c-b47d-4bdf-815b-17d010dd50e7','4f8f5e73-fa65-4741-b722-572037bd475c','8b28fa52-316b-456a-85c1-6393e2d8a0dc',1,'2026-07-04 06:46:04.074'),('900d2d6a-fd2f-4b82-a379-92c88265a55c','ce438c68-8553-48c3-9324-cf11a7a4ea93','926c8379-2fba-4f09-9f3d-c525d5c55165',1,'2026-07-04 06:46:04.037'),('91350a39-a85f-48ea-90fb-47cb48bc101f','3a8de922-921f-495d-88ee-b42b2a28fef5','4ea8788e-02b8-4035-b810-adc41830c634',1,'2026-07-04 06:46:04.018'),('9284be64-b485-4649-9da5-3a9c4254b1df','0b21d5ec-c1d7-4aa2-89fa-b7fe2438c4de','a970135e-110c-45b5-a3b1-41de30ac1eb2',1,'2026-07-04 06:46:04.056'),('9410c946-0272-4f59-a9f0-bbe063550b0c','7e38ee05-bcd0-4395-ab59-2aa6c72c05d4','d1bbcc34-2e47-47f5-9d04-c3fc1e666c02',1,'2026-07-04 06:46:04.115'),('94a178ce-391d-4b5b-a381-52f681e7d057','04278d5a-b6bf-4901-8b87-78b92b913602','705c31eb-76aa-47d7-ae19-43f68a2ef14c',1,'2026-07-04 06:46:04.007'),('94bf4362-0aae-4882-9865-4df4d75e4d5b','df91281b-437f-47f1-af5c-62e387302b3b','da44374e-eff5-4708-b46a-169f72b148a8',1,'2026-07-04 06:46:04.123'),('94d45fc9-d0fd-4eec-be1d-8bf05df2660a','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','768e7fac-7830-4d77-9b3a-688307163d51',1,'2026-07-04 06:46:03.963'),('95f01062-3286-4186-b2d9-4c9d404cb9e1','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','93a79d42-1a2c-420d-a12e-cf8260ed2508',1,'2026-07-04 06:46:03.996'),('95f081db-8ce6-4e4b-afb5-6f95ad2e63a8','4f8f5e73-fa65-4741-b722-572037bd475c','5976cdd7-cfc5-4015-8660-01e49a2a996c',1,'2026-07-04 06:46:04.074'),('96c0ef83-911c-4e96-97d6-3844c74319d9','257ce300-1df9-4aa6-8dae-26cc650c7d02','b7f9fd17-162e-4164-8ed7-20f983edd3bb',1,'2026-07-04 06:46:03.982'),('97e75b71-3746-4b8e-aee0-4ee8a25ef5e1','04278d5a-b6bf-4901-8b87-78b92b913602','86ed4d02-863f-4ee9-a54a-45cadc6a9cfb',1,'2026-07-04 06:46:04.007'),('9901832d-08a1-428b-ae9e-61371395d7a4','4f8f5e73-fa65-4741-b722-572037bd475c','e514356e-31c2-4608-8685-2765c3a54dd1',1,'2026-07-04 06:46:04.074'),('994ec4ef-dce6-47be-afd4-398a2b9ae0af','04278d5a-b6bf-4901-8b87-78b92b913602','2224313d-808d-4e97-93e7-e74fdc4004d6',1,'2026-07-04 06:46:04.007'),('9a22dbeb-8664-4e5c-a276-7a76f781b10b','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','5976cdd7-cfc5-4015-8660-01e49a2a996c',1,'2026-07-04 06:46:03.963'),('9c155054-3f8a-4a5c-9f9d-b1b470a96c79','3dae0f27-ddea-41d1-9239-b88936b4d9ff','6e1d9cf9-e0e9-44b0-909d-1d7dff1af0b3',1,'2026-07-04 06:46:04.147'),('9d2305a9-7cbe-4285-99bf-a801b77f7050','257ce300-1df9-4aa6-8dae-26cc650c7d02','ecd1ad5b-58cc-4be3-a707-4dd39a25f4dd',1,'2026-07-04 06:46:03.982'),('9dad1c9c-4b94-4fb4-b7a3-51196f6dc16b','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','366b0757-7dac-4f20-98ea-97a62920f4c1',1,'2026-07-04 06:46:03.963'),('9e1e4f7e-1a55-4e12-b3b3-726e33767fb1','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','bd548451-7f7a-400e-98a3-74bcf364500f',1,'2026-07-04 06:46:03.963'),('9e410a0c-91cf-41b8-8272-a376d7454b46','3dae0f27-ddea-41d1-9239-b88936b4d9ff','212696d3-f656-42de-9cdf-35ed9da4d3b6',1,'2026-07-04 06:46:04.147'),('9f00109c-35c5-4173-9608-db59953dbd32','9431b553-1c23-4780-bc1d-c85abace7d61','0ef90aa2-2f9e-4034-b621-5976ab579831',1,'2026-07-04 06:46:04.131'),('9f70522a-d47c-43d1-97cd-20595551f706','ce438c68-8553-48c3-9324-cf11a7a4ea93','85edbe0d-c7cd-4bf0-8062-9ac11a39c1fe',1,'2026-07-04 06:46:04.037'),('a1cf3b22-39ad-46e9-b1b1-99ac0cc4f4e4','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','e6900af0-3403-42a7-9dde-ec10f06015b4',1,'2026-07-04 06:46:03.963'),('a2ae17ab-462d-4eba-8653-e1517a626c48','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','0c718d16-0e28-493f-8b8e-f7ae63be3118',1,'2026-07-04 06:46:03.963'),('a30da4bb-180d-4669-a495-bcd192decaf3','04278d5a-b6bf-4901-8b87-78b92b913602','caf667fe-4599-40ce-b370-74de83bb11db',1,'2026-07-04 06:46:04.007'),('a34ed940-c952-4302-923f-c8e77c88cdc0','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','f9b149d0-30c7-4cf2-a1ce-e0ec2d92bd69',1,'2026-07-04 06:46:03.996'),('a452f8f5-ddae-4784-a383-7768baabb319','0b21d5ec-c1d7-4aa2-89fa-b7fe2438c4de','c23f4c80-952b-4378-9dd5-b095c35d2398',1,'2026-07-04 06:46:04.056'),('a4627186-2a06-46ef-89d9-64031cc93cef','04278d5a-b6bf-4901-8b87-78b92b913602','b9243c66-8055-43aa-8fb5-251de4586fee',1,'2026-07-04 06:46:04.007'),('a46714c6-ef91-410c-9924-fff7e1762280','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','0433a832-aae0-47b0-b1f5-97aa5088691c',1,'2026-07-04 06:46:03.963'),('a4a9a948-3ba0-4492-9401-90f38a7ce88d','5960d863-3437-4388-a909-06dd0fa180e4','433a7843-b7f6-42d1-82f0-d7164aeb2b69',1,'2026-07-04 06:46:04.107'),('a5330926-0045-453b-8974-ad9994987823','0b21d5ec-c1d7-4aa2-89fa-b7fe2438c4de','7a8be1b6-c030-4300-8d4d-9bbf84df1183',1,'2026-07-04 06:46:04.056'),('a53f7fe1-5df4-4662-87af-a242e31a3d6f','257ce300-1df9-4aa6-8dae-26cc650c7d02','4f176948-9427-41ae-af77-cfa52e30d865',1,'2026-07-04 06:46:03.982'),('a59bc8f5-ad83-4e78-8ebe-0da67be17461','04278d5a-b6bf-4901-8b87-78b92b913602','bd548451-7f7a-400e-98a3-74bcf364500f',1,'2026-07-04 06:46:04.007'),('a63ccb03-33fc-42cc-9fe3-b2c68b0b311c','257ce300-1df9-4aa6-8dae-26cc650c7d02','dc5a2fe1-0533-445b-ab70-bcd7597c9887',1,'2026-07-04 06:46:03.982'),('a7d81860-38c2-4187-babc-1e5b027a7adb','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','37c8a5b7-febd-454b-8f18-d98a5a6c0fe2',1,'2026-07-04 06:46:03.963'),('a917e874-c6cc-4795-956d-c92eeee2a668','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','858d9235-869e-48fa-ac0c-06ec23a3af7b',1,'2026-07-04 06:46:03.963'),('a9415d71-4a43-4267-9671-3cb098edc60a','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','3b778fe3-98d7-4d1e-8df1-ceec166a0b20',1,'2026-07-04 06:46:03.963'),('aa923d6d-d3ac-4175-86c3-11f37f2a1847','257ce300-1df9-4aa6-8dae-26cc650c7d02','99df5214-97ef-471a-b644-194ebf2e716a',1,'2026-07-04 06:46:03.982'),('aaa2c846-556b-4fe5-affa-d827dda13f7d','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','2224313d-808d-4e97-93e7-e74fdc4004d6',1,'2026-07-04 06:46:03.963'),('ab5c773f-dfd7-4a7c-8297-b7f4c21538e3','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','212696d3-f656-42de-9cdf-35ed9da4d3b6',1,'2026-07-04 06:46:03.996'),('abbcc6e0-51ba-4d5c-82d8-26a88656bbfb','ce438c68-8553-48c3-9324-cf11a7a4ea93','d1bbcc34-2e47-47f5-9d04-c3fc1e666c02',1,'2026-07-04 06:46:04.037'),('ac1f88d7-dd41-492f-aeca-eb2287380a06','fa1c94f0-e217-4903-bfc7-ac56c1d6cbd8','ecd1ad5b-58cc-4be3-a707-4dd39a25f4dd',1,'2026-07-04 06:46:04.138'),('ac8ada52-b3ad-44a0-9507-2136ddc2f5f5','257ce300-1df9-4aa6-8dae-26cc650c7d02','d610c5f0-3a25-40bf-989e-8df01eba1363',1,'2026-07-04 06:46:03.982'),('ad01e3a2-da1e-4985-a606-85e914a384a5','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','2061e10d-a31d-414f-9888-6dcd1f726a6c',1,'2026-07-04 06:46:03.963'),('ad5c2005-3740-4855-9ef6-e496575246f9','257ce300-1df9-4aa6-8dae-26cc650c7d02','0c718d16-0e28-493f-8b8e-f7ae63be3118',1,'2026-07-04 06:46:03.982'),('aeeea29d-01b0-4d12-b545-eca901dbac63','257ce300-1df9-4aa6-8dae-26cc650c7d02','0433a832-aae0-47b0-b1f5-97aa5088691c',1,'2026-07-04 06:46:03.982'),('b1232305-edf7-493a-8ce8-74ad249a9bbb','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','d1bbcc34-2e47-47f5-9d04-c3fc1e666c02',1,'2026-07-04 06:46:03.963'),('b1d78926-a87d-4a2c-bd73-771de15fb132','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','ecd1ad5b-58cc-4be3-a707-4dd39a25f4dd',1,'2026-07-04 06:46:03.963'),('b20f404a-e9af-43f2-abad-6e963ff4d3f7','0b21d5ec-c1d7-4aa2-89fa-b7fe2438c4de','539f6f2c-eb43-4126-8a3a-513ebe1acf7e',1,'2026-07-04 06:46:04.056'),('b212f403-1bad-4f01-b364-04c9d07910a2','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','d6185005-04b1-4ae3-b94d-929e80f2c8e4',1,'2026-07-04 06:46:03.996'),('b226c92d-01b8-4b31-9a97-5212930447e0','04278d5a-b6bf-4901-8b87-78b92b913602','3f4f335b-1cdb-49df-83ab-d7c73898c6ca',1,'2026-07-04 06:46:04.007'),('b2c178a3-55bf-4a0c-87cb-9b81aa045d40','0a4f0f17-6fe4-469b-b85a-01d71e8c0ba6','fb3ec72c-7716-488c-b5c9-c0c7970f1de7',1,'2026-07-04 06:46:04.155'),('b4d423d0-0ac9-4794-9f3a-45f303ec6de8','257ce300-1df9-4aa6-8dae-26cc650c7d02','f5366c15-ee08-44a4-b8dd-882ab7fffe32',1,'2026-07-04 06:46:03.982'),('b58862a6-8996-4445-a7e7-4996c64b0469','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','0ef90aa2-2f9e-4034-b621-5976ab579831',1,'2026-07-04 06:46:03.963'),('b5b9c052-b893-4173-a03f-6c0bfba0a856','ce438c68-8553-48c3-9324-cf11a7a4ea93','787727d2-5f99-4a84-9d01-df473a7cc207',1,'2026-07-04 06:46:04.037'),('b62d05d4-df4a-417f-96ba-cb8fa96b8045','03e40d7d-d45d-45ef-a13d-06a3a208e95c','7098474d-2000-45cf-ba57-55ff19ef1ef0',1,'2026-07-04 06:46:04.028'),('b6c68c62-280c-4f02-a0ff-3669aecb3225','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','3e7d6a13-f531-4269-826c-a934ec04e049',1,'2026-07-04 06:46:03.963'),('b71b3324-f8bc-42b9-999a-2f5616069928','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','3b778fe3-98d7-4d1e-8df1-ceec166a0b20',1,'2026-07-04 06:46:03.996'),('b7a4a179-e083-4b19-888a-6c4dd400a8d2','3a8de922-921f-495d-88ee-b42b2a28fef5','2efe2986-702f-477f-b4a9-1d283c3c1ddc',1,'2026-07-04 06:46:04.018'),('b8902473-f1f7-4311-bcf7-6e7634ef2eb0','04278d5a-b6bf-4901-8b87-78b92b913602','7098474d-2000-45cf-ba57-55ff19ef1ef0',1,'2026-07-04 06:46:04.007'),('b8e7bae8-0e30-4cd6-b0c9-b9b404ac1d75','3a8de922-921f-495d-88ee-b42b2a28fef5','0bb2f826-6845-4973-9c79-9f0a3f78bec3',1,'2026-07-04 06:46:04.018'),('b93fee47-45e9-48ef-89ac-625867dbbbb6','04278d5a-b6bf-4901-8b87-78b92b913602','85edbe0d-c7cd-4bf0-8062-9ac11a39c1fe',1,'2026-07-04 06:46:04.007'),('b9e0d703-e722-4e9f-9ff8-35143ae1e7fa','3dae0f27-ddea-41d1-9239-b88936b4d9ff','0c718d16-0e28-493f-8b8e-f7ae63be3118',1,'2026-07-04 06:46:04.147'),('b9fc96fc-ffb9-4035-a7b5-5717e87554af','7e38ee05-bcd0-4395-ab59-2aa6c72c05d4','3b778fe3-98d7-4d1e-8df1-ceec166a0b20',1,'2026-07-04 06:46:04.115'),('bbe3ac14-e400-48f5-839c-c4c9d4de15b4','257ce300-1df9-4aa6-8dae-26cc650c7d02','3f4f335b-1cdb-49df-83ab-d7c73898c6ca',1,'2026-07-04 06:46:03.982'),('bd0c196c-7a67-4a2b-ac3a-05b3b2c3780a','c32f4290-e8c3-4d4d-8382-a1b866d45dbb','48d7b224-37bf-4092-8e2b-92938af744e7',1,'2026-07-04 06:46:04.066'),('bda9f0eb-644e-40d6-b01e-cac74cfe4fd7','3dae0f27-ddea-41d1-9239-b88936b4d9ff','85edbe0d-c7cd-4bf0-8062-9ac11a39c1fe',1,'2026-07-04 06:46:04.147'),('be087106-9b58-4530-90ae-97a1f1b2a990','3dae0f27-ddea-41d1-9239-b88936b4d9ff','2efe2986-702f-477f-b4a9-1d283c3c1ddc',1,'2026-07-04 06:46:04.147'),('bf700c61-531a-466f-bd02-7f0aebcb0520','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','d57c15fa-3e12-41d1-ac56-80c3d3cdd477',1,'2026-07-04 06:46:03.963'),('bfb2870b-2d6c-4e3f-893d-a559cca56e5a','9431b553-1c23-4780-bc1d-c85abace7d61','d1bbcc34-2e47-47f5-9d04-c3fc1e666c02',1,'2026-07-04 06:46:04.131'),('bfc9a119-d855-434c-b278-21ebf0b5da4b','3a8de922-921f-495d-88ee-b42b2a28fef5','366b0757-7dac-4f20-98ea-97a62920f4c1',1,'2026-07-04 06:46:04.018'),('bfee4ae4-a082-4d60-afcc-e7448c543946','03e40d7d-d45d-45ef-a13d-06a3a208e95c','f5366c15-ee08-44a4-b8dd-882ab7fffe32',1,'2026-07-04 06:46:04.028'),('c062d875-1833-47a4-b864-e0aee1180ad8','257ce300-1df9-4aa6-8dae-26cc650c7d02','0bb2f826-6845-4973-9c79-9f0a3f78bec3',1,'2026-07-04 06:46:03.982'),('c0a788d5-70e3-4f66-9bcc-07a659530f17','7e38ee05-bcd0-4395-ab59-2aa6c72c05d4','85edbe0d-c7cd-4bf0-8062-9ac11a39c1fe',1,'2026-07-04 06:46:04.115'),('c1f93819-ca2f-4876-b940-5d54eee12309','257ce300-1df9-4aa6-8dae-26cc650c7d02','c23f4c80-952b-4378-9dd5-b095c35d2398',1,'2026-07-04 06:46:03.982'),('c542d3e2-0352-44a6-a5ef-782487bd20fb','3dae0f27-ddea-41d1-9239-b88936b4d9ff','8950992f-2e27-40d5-9657-d26cd31a19c6',1,'2026-07-04 06:46:04.147'),('c6c82385-8930-4b85-b50a-2508d9d04d51','0b21d5ec-c1d7-4aa2-89fa-b7fe2438c4de','48d7b224-37bf-4092-8e2b-92938af744e7',1,'2026-07-04 06:46:04.056'),('c73bc093-c435-41b7-8ae0-666a047aa2f1','3a8de922-921f-495d-88ee-b42b2a28fef5','fb3ec72c-7716-488c-b5c9-c0c7970f1de7',1,'2026-07-04 06:46:04.018'),('c7416d0c-c958-4185-b55a-92ca2c2f7095','5960d863-3437-4388-a909-06dd0fa180e4','ecd1ad5b-58cc-4be3-a707-4dd39a25f4dd',1,'2026-07-04 06:46:04.107'),('c8b8cc95-8aff-4135-a6f7-1c2c997e1ebb','257ce300-1df9-4aa6-8dae-26cc650c7d02','5f7b2e04-a43e-4758-b1ce-20514703db91',1,'2026-07-04 06:46:03.982'),('caab395e-b2cf-4834-be71-ed9294cd5ccd','04278d5a-b6bf-4901-8b87-78b92b913602','5976cdd7-cfc5-4015-8660-01e49a2a996c',1,'2026-07-04 06:46:04.007'),('cab8720c-f8d5-4e71-904a-2ca65f689958','3dae0f27-ddea-41d1-9239-b88936b4d9ff','433a7843-b7f6-42d1-82f0-d7164aeb2b69',1,'2026-07-04 06:46:04.147'),('cbb860d9-55d7-4464-a283-8000709ee7f7','257ce300-1df9-4aa6-8dae-26cc650c7d02','2efe2986-702f-477f-b4a9-1d283c3c1ddc',1,'2026-07-04 06:46:03.982'),('ccff11d3-47c5-415b-893e-aee11d4769c3','257ce300-1df9-4aa6-8dae-26cc650c7d02','8b9ceb8b-b3ee-47df-b704-85adbecc8fdd',1,'2026-07-04 06:46:03.982'),('cdaa87b2-bf9f-4c7b-b64e-84f8dc3dfab3','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','2224313d-808d-4e97-93e7-e74fdc4004d6',1,'2026-07-04 06:46:03.996'),('cdcbebf5-f98a-463e-bb97-e28caeb599fa','c32f4290-e8c3-4d4d-8382-a1b866d45dbb','a970135e-110c-45b5-a3b1-41de30ac1eb2',1,'2026-07-04 06:46:04.066'),('cdce732b-cec0-4469-982d-55665490df6c','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','eb71a17a-58ed-4295-97a1-e7416c4c3e7d',1,'2026-07-04 06:46:03.996'),('cde7d0f1-140b-4a5a-9253-f4dd351c40a6','4f8f5e73-fa65-4741-b722-572037bd475c','b9243c66-8055-43aa-8fb5-251de4586fee',1,'2026-07-04 06:46:04.074'),('cfc091be-c948-429f-8795-36c9feefa7f3','4ad8335e-585e-4d31-a59f-2c8c82e310ed','2224313d-808d-4e97-93e7-e74fdc4004d6',1,'2026-07-04 06:46:04.092'),('d075dfbb-eaf1-4495-938c-ed89e1915d22','04278d5a-b6bf-4901-8b87-78b92b913602','d1bbcc34-2e47-47f5-9d04-c3fc1e666c02',1,'2026-07-04 06:46:04.007'),('d13ddff4-50bc-4eed-8e55-4a10b186594c','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','f5366c15-ee08-44a4-b8dd-882ab7fffe32',1,'2026-07-04 06:46:03.963'),('d15a9350-c4a0-4b95-947f-ee36ca274231','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','7a8be1b6-c030-4300-8d4d-9bbf84df1183',1,'2026-07-04 06:46:03.996'),('d282d66c-0479-48ac-a746-c052e86a1797','fa1c94f0-e217-4903-bfc7-ac56c1d6cbd8','433a7843-b7f6-42d1-82f0-d7164aeb2b69',1,'2026-07-04 06:46:04.138'),('d3ded436-f1c8-41b4-9030-b6de9a810831','13552ca5-b9b8-47ef-bdec-6bc60ae68c17','e8284b2c-0d6e-4c9a-9cbd-1d2839e7c39d',1,'2026-07-04 06:46:04.100'),('d46fcbee-8d0c-445e-9f14-568902428666','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','6e1d9cf9-e0e9-44b0-909d-1d7dff1af0b3',1,'2026-07-04 06:46:03.963'),('d49084c7-d5c8-412f-ab1d-34c80dc3f3a5','04278d5a-b6bf-4901-8b87-78b92b913602','e8284b2c-0d6e-4c9a-9cbd-1d2839e7c39d',1,'2026-07-04 06:46:04.007'),('d4d2ab34-356b-4286-b9f3-39510a9e9713','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','8950992f-2e27-40d5-9657-d26cd31a19c6',1,'2026-07-04 06:46:03.963'),('d621ccb0-f3b8-4047-ac91-d55176facbdb','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','b2ecc664-496a-4f5e-b9d9-81514250b271',1,'2026-07-04 06:46:03.996'),('d6ac94c0-2f3d-4e4a-b72b-aaa7cff7ffd9','03e40d7d-d45d-45ef-a13d-06a3a208e95c','d6185005-04b1-4ae3-b94d-929e80f2c8e4',1,'2026-07-04 06:46:04.028'),('d70d1903-26f5-4f5f-bba6-5e3e4567825e','257ce300-1df9-4aa6-8dae-26cc650c7d02','da44374e-eff5-4708-b46a-169f72b148a8',1,'2026-07-04 06:46:03.982'),('d72e8bbc-585d-4f0b-9431-c9fdc0809673','df91281b-437f-47f1-af5c-62e387302b3b','e6900af0-3403-42a7-9dde-ec10f06015b4',1,'2026-07-04 06:46:04.123'),('d74f86a8-3d01-492d-aae9-62efed0e0d68','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','b4cf4220-d8e9-4b7b-8b2c-56ef1f65f5ee',1,'2026-07-04 06:46:03.963'),('d75bcace-1d63-4d9f-8213-4518ca7db13a','257ce300-1df9-4aa6-8dae-26cc650c7d02','7a8be1b6-c030-4300-8d4d-9bbf84df1183',1,'2026-07-04 06:46:03.982'),('d77d019d-6dca-4d13-b31c-c3944c31b460','9431b553-1c23-4780-bc1d-c85abace7d61','e8284b2c-0d6e-4c9a-9cbd-1d2839e7c39d',1,'2026-07-04 06:46:04.131'),('d7f8262c-35ad-47b3-b0d7-3e82ba9f0f9b','13552ca5-b9b8-47ef-bdec-6bc60ae68c17','9aa3e079-0991-4090-a668-e4536e08ee11',1,'2026-07-04 06:46:04.100'),('d80e604a-bab2-42b6-a1a8-6e4adc9f9eda','fa1c94f0-e217-4903-bfc7-ac56c1d6cbd8','85edbe0d-c7cd-4bf0-8062-9ac11a39c1fe',1,'2026-07-04 06:46:04.138'),('d8471f05-720f-41fb-a0d2-e77ff01e7082','4b8f5ef8-05f6-49e3-ae90-c56fc28b7fd5','9aa3e079-0991-4090-a668-e4536e08ee11',1,'2026-07-04 06:46:04.084'),('d8f56115-3602-4414-9c1f-bf0f61529f56','257ce300-1df9-4aa6-8dae-26cc650c7d02','433a7843-b7f6-42d1-82f0-d7164aeb2b69',1,'2026-07-04 06:46:03.982'),('da49000d-d567-43cf-9e31-ddc7254ee17c','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','467a5493-3fd3-48c7-90c2-0bf3bf616b68',1,'2026-07-04 06:46:03.996'),('dab9436b-7ae9-4d3a-82d5-82a0682fb2ff','13552ca5-b9b8-47ef-bdec-6bc60ae68c17','bb54868e-b495-4a85-b857-1c1100c94fbd',1,'2026-07-04 06:46:04.100'),('db8b4256-59a6-459e-8f02-4c67a502098e','7b630878-0f4b-43c5-88c1-e3b85f20fbd8','d1bbcc34-2e47-47f5-9d04-c3fc1e666c02',1,'2026-07-04 06:46:04.048'),('dc9d06ac-0b59-46da-b417-53fee70cbb0c','4f8f5e73-fa65-4741-b722-572037bd475c','2efe2986-702f-477f-b4a9-1d283c3c1ddc',1,'2026-07-04 06:46:04.074'),('dcc29520-a6db-449f-bf78-988c5de7ff66','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','4ea8788e-02b8-4035-b810-adc41830c634',1,'2026-07-04 06:46:03.996'),('dd1dc8e1-2c3e-4167-b2be-a5c863fd2499','04278d5a-b6bf-4901-8b87-78b92b913602','8b9ceb8b-b3ee-47df-b704-85adbecc8fdd',1,'2026-07-04 06:46:04.007'),('ddfdc73e-396a-4e99-b57e-d4968371de87','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','b103d9c8-f64a-4849-b4d8-512b57006d10',1,'2026-07-04 06:46:03.963'),('de3dad65-a7f6-4504-92b4-7c5db645fd53','df91281b-437f-47f1-af5c-62e387302b3b','1e7d4627-e3fd-4d78-82b0-51b0a882fc96',1,'2026-07-04 06:46:04.123'),('de62b6c8-dc4f-4314-b0c2-dec3254598dc','7e38ee05-bcd0-4395-ab59-2aa6c72c05d4','7a8be1b6-c030-4300-8d4d-9bbf84df1183',1,'2026-07-04 06:46:04.115'),('dfa9025d-b557-407d-8d63-2f87c47ad8bd','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','8b28fa52-316b-456a-85c1-6393e2d8a0dc',1,'2026-07-04 06:46:03.996'),('dfcf6b04-edd9-4103-af0c-7bee9f3ca2b2','257ce300-1df9-4aa6-8dae-26cc650c7d02','9aa3e079-0991-4090-a668-e4536e08ee11',1,'2026-07-04 06:46:03.982'),('e38cd8db-47ab-4475-9d64-c2dbe7cd9e3e','257ce300-1df9-4aa6-8dae-26cc650c7d02','a58d610e-fb56-41bb-9dde-e52a4fd36d9e',1,'2026-07-04 06:46:03.982'),('e3b7013d-0be7-4695-98e8-418b53ed503b','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','366b0757-7dac-4f20-98ea-97a62920f4c1',1,'2026-07-04 06:46:03.996'),('e49c0163-4a53-4cd3-bdce-f4f50dadb0a0','3a8de922-921f-495d-88ee-b42b2a28fef5','8b9ceb8b-b3ee-47df-b704-85adbecc8fdd',1,'2026-07-04 06:46:04.018'),('e5100a29-11b3-429a-aa2c-e4079c17481f','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','5f7b2e04-a43e-4758-b1ce-20514703db91',1,'2026-07-04 06:46:03.963'),('e573a4eb-8402-45cb-ae37-43681341a8b6','7b630878-0f4b-43c5-88c1-e3b85f20fbd8','3f4f335b-1cdb-49df-83ab-d7c73898c6ca',1,'2026-07-04 06:46:04.048'),('e5b9f470-6eb8-4327-a8b4-fcbc5305f2a6','257ce300-1df9-4aa6-8dae-26cc650c7d02','727e2483-3478-4f1b-9bd2-84c7f16d809e',1,'2026-07-04 06:46:03.982'),('e5e269eb-6a0f-49a7-828e-681f1f9f7cde','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','b9243c66-8055-43aa-8fb5-251de4586fee',1,'2026-07-04 06:46:03.996'),('e6047987-97aa-453d-80c9-ea006f6bd44b','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','3f4f335b-1cdb-49df-83ab-d7c73898c6ca',1,'2026-07-04 06:46:03.963'),('e6604d65-ef2b-46f7-a99c-9a53dcbb5afd','04278d5a-b6bf-4901-8b87-78b92b913602','f9b149d0-30c7-4cf2-a1ce-e0ec2d92bd69',1,'2026-07-04 06:46:04.007'),('e7279512-a1fb-49df-8591-b378bef6a4cc','4ad8335e-585e-4d31-a59f-2c8c82e310ed','caf667fe-4599-40ce-b370-74de83bb11db',1,'2026-07-04 06:46:04.092'),('e82d6431-ad6c-47b2-8383-4a1f35c7fdfa','257ce300-1df9-4aa6-8dae-26cc650c7d02','86ed4d02-863f-4ee9-a54a-45cadc6a9cfb',1,'2026-07-04 06:46:03.982'),('e8e0592f-4828-4054-8d92-a9190145ca14','4b8f5ef8-05f6-49e3-ae90-c56fc28b7fd5','2efe2986-702f-477f-b4a9-1d283c3c1ddc',1,'2026-07-04 06:46:04.084'),('e982f6b4-03b4-4c87-9ca7-76e430b7cc7a','04278d5a-b6bf-4901-8b87-78b92b913602','eb71a17a-58ed-4295-97a1-e7416c4c3e7d',1,'2026-07-04 06:46:04.007'),('e9b019fc-62ac-4cb9-861e-1b45c72d1dae','3dae0f27-ddea-41d1-9239-b88936b4d9ff','3b778fe3-98d7-4d1e-8df1-ceec166a0b20',1,'2026-07-04 06:46:04.147'),('e9f0b1e7-05a9-4c9c-87d5-3ffc1b29d79a','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','0f1fc73d-184f-4e9b-8e84-b613eecb86ad',1,'2026-08-12 05:35:49.970'),('ea83613d-26c6-4dd0-98fd-dd335d23ad63','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','bb54868e-b495-4a85-b857-1c1100c94fbd',1,'2026-07-04 06:46:03.963'),('ec1911b1-a4c1-4c2e-ab97-74c6e8388b60','03e40d7d-d45d-45ef-a13d-06a3a208e95c','0bb2f826-6845-4973-9c79-9f0a3f78bec3',1,'2026-07-04 06:46:04.028'),('ec5770c6-3d4d-4bae-8dd4-2fa71c284126','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','56fc2eb8-467c-4ec2-8fe3-124fa2423949',1,'2026-07-04 06:46:03.963'),('ecf0963d-07cb-474d-8600-8c6b39a12c3a','257ce300-1df9-4aa6-8dae-26cc650c7d02','56fc2eb8-467c-4ec2-8fe3-124fa2423949',1,'2026-07-04 06:46:03.982'),('eee4539f-245e-4a1b-9b32-78c543bb7303','ce438c68-8553-48c3-9324-cf11a7a4ea93','f43d6f6b-dbee-4678-abd2-615711392bbb',1,'2026-07-04 06:46:04.037'),('f003157e-5333-4d8d-9bf4-bc028bc39e3b','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','2efe2986-702f-477f-b4a9-1d283c3c1ddc',1,'2026-07-04 06:46:03.963'),('f05aafd3-3cfc-4236-88ee-43e22c55610d','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','0c718d16-0e28-493f-8b8e-f7ae63be3118',1,'2026-07-04 06:46:03.996'),('f0efdcca-6d1e-4173-b798-e105adf13f1b','7b630878-0f4b-43c5-88c1-e3b85f20fbd8','d67c4e22-65af-4450-a934-86965fc74bd6',1,'2026-07-04 06:46:04.048'),('f1059aa0-6352-4cde-87ca-b3f16662f686','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9','5976cdd7-cfc5-4015-8660-01e49a2a996c',1,'2026-07-04 06:46:03.996'),('f154da89-74bc-461d-b566-73ee6bf0458f','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','8b28fa52-316b-456a-85c1-6393e2d8a0dc',1,'2026-07-04 06:46:03.963'),('f1a70a53-deea-4aee-ae5c-7189eeaaf0a7','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','99df5214-97ef-471a-b644-194ebf2e716a',1,'2026-07-04 06:46:03.963'),('f1c48716-d4e6-4e59-9b51-90a627f8e3cf','257ce300-1df9-4aa6-8dae-26cc650c7d02','d1bbcc34-2e47-47f5-9d04-c3fc1e666c02',1,'2026-07-04 06:46:03.982'),('f2317b00-b6cb-461f-9be9-63bd7f7a2c59','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','467a5493-3fd3-48c7-90c2-0bf3bf616b68',1,'2026-07-04 06:46:03.963'),('f278483d-317c-4523-b794-f943aea1f788','257ce300-1df9-4aa6-8dae-26cc650c7d02','9c27177c-315a-4d57-9b8e-32a9d46134ab',1,'2026-07-04 06:46:03.982'),('f35b07ae-d3a0-4275-94a6-6ff16f6d4275','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','da44374e-eff5-4708-b46a-169f72b148a8',1,'2026-07-04 06:46:03.963'),('f3c4aa0c-d883-4508-9a1b-f53968964a59','7e38ee05-bcd0-4395-ab59-2aa6c72c05d4','5976cdd7-cfc5-4015-8660-01e49a2a996c',1,'2026-07-04 06:46:04.115'),('f4916dad-78ad-4e60-9525-5bfb7daf5e36','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','9aa3e079-0991-4090-a668-e4536e08ee11',1,'2026-07-04 06:46:03.963'),('f4c86811-52fc-49ab-a1cc-bfc5586f1dc3','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','86ed4d02-863f-4ee9-a54a-45cadc6a9cfb',1,'2026-07-04 06:46:03.963'),('f516662a-9745-4f22-818b-7928ad7287aa','04278d5a-b6bf-4901-8b87-78b92b913602','212696d3-f656-42de-9cdf-35ed9da4d3b6',1,'2026-07-04 06:46:04.007'),('f5906ba5-eb00-4560-a6e5-0dd2cd7cae6b','04278d5a-b6bf-4901-8b87-78b92b913602','6f00eb53-f115-4265-9dbb-fb66afa4992a',1,'2026-07-04 06:46:04.007'),('f66509f4-983c-48ac-9b4a-26db92a322b0','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','f43d6f6b-dbee-4678-abd2-615711392bbb',1,'2026-07-04 06:46:03.963'),('f807675d-a58d-4f4b-97c3-b686a0c1957a','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','727e2483-3478-4f1b-9bd2-84c7f16d809e',1,'2026-07-04 06:46:03.963'),('f881453a-66e9-4d45-bb0d-30c407ce94fe','04278d5a-b6bf-4901-8b87-78b92b913602','fa46e516-2562-4175-b865-51228f09f365',1,'2026-07-04 06:46:04.007'),('f8a7635d-d934-4de7-90da-f6ac7b8c025f','04278d5a-b6bf-4901-8b87-78b92b913602','fb3ec72c-7716-488c-b5c9-c0c7970f1de7',1,'2026-07-04 06:46:04.007'),('faeb1bd5-7915-45a9-803a-f3a035da32f6','257ce300-1df9-4aa6-8dae-26cc650c7d02','8b28fa52-316b-456a-85c1-6393e2d8a0dc',1,'2026-07-04 06:46:03.982'),('fd0fd1fc-1db2-461a-86f6-f44d776de54a','257ce300-1df9-4aa6-8dae-26cc650c7d02','bb54868e-b495-4a85-b857-1c1100c94fbd',1,'2026-07-04 06:46:03.982'),('fd5f8372-41c2-42b7-949d-72267e6dc0e1','257ce300-1df9-4aa6-8dae-26cc650c7d02','d67c4e22-65af-4450-a934-86965fc74bd6',1,'2026-07-04 06:46:03.982'),('fe0dfae6-2610-4847-b099-494151ea48c1','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','1e7d4627-e3fd-4d78-82b0-51b0a882fc96',1,'2026-07-04 06:46:03.963'),('feaa2667-2ac2-40dd-afa1-d6a942aeaa14','3a8de922-921f-495d-88ee-b42b2a28fef5','f5366c15-ee08-44a4-b8dd-882ab7fffe32',1,'2026-07-04 06:46:04.018'),('ff0f05e9-73bc-4a1a-9528-3591fb9f5883','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','705c31eb-76aa-47d7-ae19-43f68a2ef14c',1,'2026-07-04 06:46:03.963'),('ff271a2a-f908-4780-b086-b97afd0e98b8','04278d5a-b6bf-4901-8b87-78b92b913602','b2ecc664-496a-4f5e-b9d9-81514250b271',1,'2026-07-04 06:46:04.007');
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id` varchar(191) NOT NULL,
  `companyId` varchar(191) DEFAULT NULL,
  `name` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`permissions`)),
  `dataScope` enum('OWN','TEAM','BRANCH','COMPANY','GLOBAL') NOT NULL DEFAULT 'OWN',
  `parentRoleId` varchar(191) DEFAULT NULL,
  `hierarchyLevel` int(11) NOT NULL DEFAULT 0,
  `isSystem` tinyint(1) NOT NULL DEFAULT 0,
  `isCustom` tinyint(1) NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_slug_key` (`slug`),
  KEY `roles_companyId_idx` (`companyId`),
  KEY `roles_isActive_idx` (`isActive`),
  KEY `roles_parentRoleId_fkey` (`parentRoleId`),
  CONSTRAINT `roles_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `roles_parentRoleId_fkey` FOREIGN KEY (`parentRoleId`) REFERENCES `roles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES ('03e40d7d-d45d-45ef-a13d-06a3a208e95c',NULL,'Counsellor','counsellor','Handles enquiries, leads and students','[\"dashboard.view\",\"reception.walkin.view\",\"reception.walkin.create\",\"reception.walkin.update\",\"enquiry.view\",\"enquiry.create\",\"enquiry.update\",\"lead.view\",\"lead.create\",\"lead.update\",\"student.view\",\"student.create\",\"student.update\",\"application.view\",\"application.create\",\"application.update\",\"document.view\",\"document.upload\"]','OWN','3a8de922-921f-495d-88ee-b42b2a28fef5',5,1,0,1,'2026-07-04 06:34:52.081','2026-07-04 06:46:04.172',NULL,NULL,NULL),('04278d5a-b6bf-4901-8b87-78b92b913602',NULL,'Branch Manager','branch_manager','Manages branch operations and team','[\"dashboard.view\",\"dashboard.analytics\",\"reception.walkin.view\",\"reception.walkin.create\",\"reception.walkin.update\",\"reception.walkin.delete\",\"reception.walkin.assign\",\"enquiry.view\",\"enquiry.create\",\"enquiry.update\",\"enquiry.delete\",\"enquiry.assign\",\"enquiry.import\",\"enquiry.export\",\"enquiry.approve\",\"enquiry.bulk\",\"lead.view\",\"lead.create\",\"lead.update\",\"lead.delete\",\"lead.assign\",\"lead.export\",\"student.view\",\"student.create\",\"student.update\",\"student.delete\",\"student.assign\",\"student.export\",\"application.view\",\"application.create\",\"application.update\",\"application.assign\",\"visa.view\",\"visa.create\",\"visa.update\",\"reports.view\",\"reports.export\",\"users.view\"]','BRANCH','3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9',3,1,0,1,'2026-07-04 06:34:52.053','2026-07-04 06:46:04.165',NULL,NULL,NULL),('0a4f0f17-6fe4-469b-b85a-01d71e8c0ba6',NULL,'Custom Role','custom_role','Template for custom roles — clone and customize','[\"dashboard.view\"]','OWN',NULL,9,1,1,1,'2026-07-04 06:34:52.301','2026-07-04 06:46:04.150',NULL,NULL,NULL),('0b21d5ec-c1d7-4aa2-89fa-b7fe2438c4de',NULL,'Finance Manager','finance_manager',NULL,'[\"accounts.invoice.view\",\"accounts.invoice.create\",\"accounts.invoice.edit\",\"accounts.invoice.delete\",\"accounts.payment.collect\",\"reports.view\",\"reports.export\"]','COMPANY','257ce300-1df9-4aa6-8dae-26cc650c7d02',4,1,0,1,'2026-07-04 06:34:52.124','2026-07-04 06:46:04.183',NULL,NULL,NULL),('13552ca5-b9b8-47ef-bdec-6bc60ae68c17',NULL,'Telecaller','telecaller',NULL,'[\"enquiry.view\",\"enquiry.create\",\"enquiry.update\",\"lead.view\",\"lead.create\"]','OWN','3a8de922-921f-495d-88ee-b42b2a28fef5',6,1,0,1,'2026-07-04 06:34:52.165','2026-07-04 06:46:04.199',NULL,NULL,NULL),('257ce300-1df9-4aa6-8dae-26cc650c7d02',NULL,'Company Admin','company_admin','Full company-level administration','[\"dashboard.view\",\"dashboard.analytics\",\"dashboard.export\",\"enquiry.view\",\"enquiry.create\",\"enquiry.update\",\"enquiry.delete\",\"enquiry.assign\",\"enquiry.import\",\"enquiry.export\",\"enquiry.approve\",\"enquiry.bulk\",\"lead.view\",\"lead.create\",\"lead.update\",\"lead.delete\",\"lead.assign\",\"lead.export\",\"reception.walkin.view\",\"reception.walkin.create\",\"reception.walkin.update\",\"reception.walkin.delete\",\"reception.walkin.assign\",\"student.view\",\"student.create\",\"student.update\",\"student.delete\",\"student.assign\",\"student.export\",\"application.view\",\"application.create\",\"application.update\",\"application.delete\",\"application.assign\",\"application.submit\",\"application.finalize\",\"visa.view\",\"visa.create\",\"visa.update\",\"visa.delete\",\"visa.approve\",\"visa.reject\",\"accounts.invoice.view\",\"accounts.invoice.create\",\"accounts.invoice.edit\",\"accounts.invoice.delete\",\"accounts.payment.collect\",\"partner.view\",\"partner.create\",\"partner.update\",\"partner.delete\",\"document.view\",\"document.upload\",\"document.delete\",\"reports.view\",\"reports.export\",\"users.view\",\"users.create\",\"users.update\",\"users.delete\",\"roles.view\",\"roles.create\",\"roles.update\",\"roles.delete\",\"roles.assign\",\"roles.export\",\"roles.clone\",\"settings.view\",\"settings.manage\",\"masters.manage\"]','COMPANY','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee',1,1,0,1,'2026-07-04 06:34:52.007','2026-07-04 06:46:04.157',NULL,NULL,NULL),('3879fc07-e6f3-4cc6-a6d8-d09e000b3ae9',NULL,'Operational Head','operational_head','Oversees operations across branches','[\"dashboard.view\",\"dashboard.analytics\",\"dashboard.export\",\"reception.walkin.view\",\"reception.walkin.create\",\"reception.walkin.update\",\"reception.walkin.delete\",\"reception.walkin.assign\",\"enquiry.view\",\"enquiry.create\",\"enquiry.update\",\"enquiry.delete\",\"enquiry.assign\",\"enquiry.import\",\"enquiry.export\",\"enquiry.approve\",\"enquiry.bulk\",\"lead.view\",\"lead.create\",\"lead.update\",\"lead.delete\",\"lead.assign\",\"lead.export\",\"student.view\",\"student.create\",\"student.update\",\"student.delete\",\"student.assign\",\"student.export\",\"application.view\",\"application.create\",\"application.update\",\"application.delete\",\"application.assign\",\"application.submit\",\"application.finalize\",\"visa.view\",\"visa.create\",\"visa.update\",\"visa.delete\",\"visa.approve\",\"visa.reject\",\"reports.view\",\"reports.export\",\"users.view\",\"roles.view\"]','COMPANY','257ce300-1df9-4aa6-8dae-26cc650c7d02',2,1,0,1,'2026-07-04 06:34:52.027','2026-07-04 06:46:04.162',NULL,NULL,NULL),('3a8de922-921f-495d-88ee-b42b2a28fef5',NULL,'Team Leader','team_leader','Leads counsellor team within branch','[\"dashboard.view\",\"reception.walkin.view\",\"reception.walkin.create\",\"reception.walkin.update\",\"reception.walkin.assign\",\"enquiry.view\",\"enquiry.create\",\"enquiry.update\",\"enquiry.assign\",\"enquiry.import\",\"enquiry.export\",\"enquiry.approve\",\"enquiry.bulk\",\"lead.view\",\"lead.create\",\"lead.update\",\"lead.assign\",\"lead.export\",\"student.view\",\"student.create\",\"student.update\",\"student.assign\",\"student.export\",\"application.view\",\"application.create\",\"application.update\",\"enquiry.assign\",\"lead.assign\",\"student.assign\",\"reports.view\"]','TEAM','04278d5a-b6bf-4901-8b87-78b92b913602',4,1,0,1,'2026-07-04 06:34:52.070','2026-07-04 06:46:04.169',NULL,NULL,NULL),('3dae0f27-ddea-41d1-9239-b88936b4d9ff',NULL,'Viewer','viewer',NULL,'[\"dashboard.view\",\"enquiry.view\",\"lead.view\",\"reception.walkin.view\",\"student.view\",\"application.view\",\"visa.view\",\"accounts.invoice.view\",\"partner.view\",\"document.view\",\"reports.view\",\"users.view\",\"roles.view\",\"settings.view\",\"audit.view\"]','BRANCH',NULL,7,1,0,1,'2026-07-04 06:34:52.255','2026-07-04 06:46:04.141',NULL,NULL,NULL),('4ad8335e-585e-4d31-a59f-2c8c82e310ed',NULL,'Receptionist','receptionist',NULL,'[\"reception.walkin.view\",\"reception.walkin.create\",\"reception.walkin.update\",\"reception.walkin.assign\",\"lead.view\",\"lead.create\"]','BRANCH','04278d5a-b6bf-4901-8b87-78b92b913602',6,1,0,1,'2026-07-04 06:34:52.156','2026-07-04 06:46:04.196',NULL,NULL,NULL),('4b8f5ef8-05f6-49e3-ae90-c56fc28b7fd5',NULL,'Marketing Executive','marketing_executive',NULL,'[\"enquiry.view\",\"enquiry.create\",\"enquiry.update\",\"lead.view\",\"lead.create\"]','BRANCH','4f8f5e73-fa65-4741-b722-572037bd475c',5,1,0,1,'2026-07-04 06:34:52.148','2026-07-04 06:46:04.192',NULL,NULL,NULL),('4f8f5e73-fa65-4741-b722-572037bd475c',NULL,'Marketing Manager','marketing_manager',NULL,'[\"dashboard.view\",\"dashboard.analytics\",\"enquiry.view\",\"enquiry.create\",\"enquiry.update\",\"enquiry.delete\",\"enquiry.assign\",\"enquiry.import\",\"enquiry.export\",\"enquiry.approve\",\"enquiry.bulk\",\"reports.view\",\"reports.export\"]','COMPANY','257ce300-1df9-4aa6-8dae-26cc650c7d02',4,1,0,1,'2026-07-04 06:34:52.140','2026-07-04 06:46:04.189',NULL,NULL,NULL),('5960d863-3437-4388-a909-06dd0fa180e4',NULL,'Document Executive','document_executive',NULL,'[\"document.view\",\"document.upload\",\"student.view\",\"application.view\"]','BRANCH','04278d5a-b6bf-4901-8b87-78b92b913602',6,1,0,1,'2026-07-04 06:34:52.174','2026-07-04 06:46:04.204',NULL,NULL,NULL),('7b630878-0f4b-43c5-88c1-e3b85f20fbd8',NULL,'Visa Officer','visa_officer',NULL,'[\"student.view\",\"visa.view\",\"visa.create\",\"visa.update\",\"visa.delete\",\"visa.approve\",\"visa.reject\"]','BRANCH','04278d5a-b6bf-4901-8b87-78b92b913602',5,1,0,1,'2026-07-04 06:34:52.115','2026-07-04 06:46:04.180',NULL,NULL,NULL),('7e38ee05-bcd0-4395-ab59-2aa6c72c05d4',NULL,'Compliance Officer','compliance_officer',NULL,'[\"audit.view\",\"reports.view\",\"reports.export\",\"student.view\",\"application.view\",\"visa.view\"]','COMPANY','257ce300-1df9-4aa6-8dae-26cc650c7d02',4,1,0,1,'2026-07-04 06:34:52.185','2026-07-04 06:46:04.214',NULL,NULL,NULL),('9431b553-1c23-4780-bc1d-c85abace7d61',NULL,'Partner','partner',NULL,'[\"enquiry.view\",\"enquiry.create\",\"student.view\",\"partner.view\"]','OWN','df91281b-437f-47f1-af5c-62e387302b3b',7,1,0,1,'2026-07-04 06:34:52.202','2026-07-04 06:46:04.224',NULL,NULL,NULL),('c32f4290-e8c3-4d4d-8382-a1b866d45dbb',NULL,'Finance Executive','finance_executive',NULL,'[\"accounts.invoice.view\",\"accounts.invoice.create\",\"accounts.invoice.edit\",\"accounts.payment.collect\"]','BRANCH','0b21d5ec-c1d7-4aa2-89fa-b7fe2438c4de',5,1,0,1,'2026-07-04 06:34:52.132','2026-07-04 06:46:04.186',NULL,NULL,NULL),('ce438c68-8553-48c3-9324-cf11a7a4ea93',NULL,'Application Officer','application_officer',NULL,'[\"student.view\",\"application.view\",\"application.create\",\"application.update\",\"application.delete\",\"application.assign\",\"application.submit\",\"application.finalize\"]','BRANCH','04278d5a-b6bf-4901-8b87-78b92b913602',5,1,0,1,'2026-07-04 06:34:52.105','2026-07-04 06:46:04.176',NULL,NULL,NULL),('df91281b-437f-47f1-af5c-62e387302b3b',NULL,'Partner Manager','partner_manager',NULL,'[\"partner.view\",\"partner.create\",\"partner.update\",\"partner.delete\"]','COMPANY','257ce300-1df9-4aa6-8dae-26cc650c7d02',4,1,0,1,'2026-07-04 06:34:52.192','2026-07-04 06:46:04.221',NULL,NULL,NULL),('e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee',NULL,'Super Admin','super_admin','Full global access across all companies and modules','[\"dashboard.view\",\"dashboard.analytics\",\"dashboard.export\",\"enquiry.view\",\"enquiry.create\",\"enquiry.update\",\"enquiry.delete\",\"enquiry.assign\",\"enquiry.import\",\"enquiry.export\",\"enquiry.approve\",\"enquiry.bulk\",\"lead.view\",\"lead.create\",\"lead.update\",\"lead.delete\",\"lead.assign\",\"lead.export\",\"reception.walkin.view\",\"reception.walkin.create\",\"reception.walkin.update\",\"reception.walkin.delete\",\"reception.walkin.assign\",\"student.view\",\"student.create\",\"student.update\",\"student.delete\",\"student.assign\",\"student.export\",\"application.view\",\"application.create\",\"application.update\",\"application.delete\",\"application.assign\",\"application.submit\",\"application.finalize\",\"visa.view\",\"visa.create\",\"visa.update\",\"visa.delete\",\"visa.approve\",\"visa.reject\",\"accounts.invoice.view\",\"accounts.invoice.create\",\"accounts.invoice.edit\",\"accounts.invoice.delete\",\"accounts.payment.collect\",\"partner.view\",\"partner.create\",\"partner.update\",\"partner.delete\",\"document.view\",\"document.upload\",\"document.delete\",\"reports.view\",\"reports.export\",\"users.view\",\"users.create\",\"users.update\",\"users.delete\",\"roles.view\",\"roles.create\",\"roles.update\",\"roles.delete\",\"roles.assign\",\"roles.export\",\"roles.clone\",\"settings.view\",\"settings.manage\",\"masters.manage\",\"audit.view\"]','GLOBAL',NULL,0,1,0,1,'2026-07-04 06:34:51.987','2026-07-04 06:46:03.953',NULL,NULL,NULL),('fa1c94f0-e217-4903-bfc7-ac56c1d6cbd8',NULL,'Student','student_portal',NULL,'[\"student.view\",\"application.view\",\"document.view\",\"document.upload\"]','OWN',NULL,8,1,0,1,'2026-07-04 06:34:52.225','2026-07-04 06:46:04.134',NULL,NULL,NULL);
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saved_filters`
--

DROP TABLE IF EXISTS `saved_filters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `saved_filters` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `module` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `filters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`filters`)),
  `isDefault` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `saved_filters_userId_module_idx` (`userId`,`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saved_filters`
--

LOCK TABLES `saved_filters` WRITE;
/*!40000 ALTER TABLE `saved_filters` DISABLE KEYS */;
/*!40000 ALTER TABLE `saved_filters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `students` (
  `id` varchar(191) NOT NULL,
  `branchId` varchar(191) NOT NULL,
  `partnerId` varchar(191) DEFAULT NULL,
  `assignedToId` varchar(191) DEFAULT NULL,
  `studentCode` varchar(191) NOT NULL,
  `firstName` varchar(191) NOT NULL,
  `lastName` varchar(191) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `dateOfBirth` datetime(3) DEFAULT NULL,
  `gender` varchar(191) DEFAULT NULL,
  `nationality` varchar(191) DEFAULT NULL,
  `passportNo` varchar(191) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `status` enum('ENQUIRY','REGISTERED','DOCUMENT_PENDING','APPLICATION_SUBMITTED','OFFER_RECEIVED','VISA_APPLIED','VISA_GRANTED','ENROLLED','DEFERRED','WITHDRAWN') NOT NULL DEFAULT 'ENQUIRY',
  `intake` varchar(191) DEFAULT NULL,
  `course` varchar(191) DEFAULT NULL,
  `university` varchar(191) DEFAULT NULL,
  `country` varchar(191) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `students_studentCode_key` (`studentCode`),
  KEY `students_branchId_idx` (`branchId`),
  KEY `students_assignedToId_idx` (`assignedToId`),
  KEY `students_status_idx` (`status`),
  KEY `students_studentCode_idx` (`studentCode`),
  KEY `students_email_idx` (`email`),
  KEY `students_partnerId_fkey` (`partnerId`),
  CONSTRAINT `students_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `students_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `students_partnerId_fkey` FOREIGN KEY (`partnerId`) REFERENCES `partners` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `taxes`
--

DROP TABLE IF EXISTS `taxes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `taxes` (
  `id` varchar(191) NOT NULL,
  `companyId` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `taxPercentage` decimal(8,4) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `taxes_companyId_code_key` (`companyId`,`code`),
  KEY `taxes_companyId_idx` (`companyId`),
  KEY `taxes_isActive_idx` (`isActive`),
  CONSTRAINT `taxes_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `taxes`
--

LOCK TABLES `taxes` WRITE;
/*!40000 ALTER TABLE `taxes` DISABLE KEYS */;
INSERT INTO `taxes` VALUES ('0c7931c9-44a7-4485-bef8-fd64be40485f','a7c7c0df-60c6-4a73-88d0-92b2fa521655','GST_12','GST 12%',12.0000,NULL,1,2,'2026-08-11 12:55:28.781','2026-08-11 12:55:28.781',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('41372777-b010-49b9-a08e-0494eee848fa','a7c7c0df-60c6-4a73-88d0-92b2fa521655','ZERO_RATED','Zero Rated',0.0000,NULL,1,5,'2026-08-11 12:55:28.796','2026-08-11 12:55:28.796',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('51b8a4d4-9a5d-4656-9350-90451a750ecd','a7c7c0df-60c6-4a73-88d0-92b2fa521655','EXEMPT','Exempt',0.0000,NULL,1,4,'2026-08-11 12:55:28.791','2026-08-11 12:55:28.791',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('c194c90f-137c-4789-87ee-d74234a319e8','a7c7c0df-60c6-4a73-88d0-92b2fa521655','GST_18','GST 18%',18.0000,NULL,1,1,'2026-08-11 12:55:28.775','2026-08-11 12:55:28.775',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('e10efce9-dccc-4128-a64e-3f72b366bdba','a7c7c0df-60c6-4a73-88d0-92b2fa521655','GST_5','GST 5%',5.0000,NULL,1,3,'2026-08-11 12:55:28.785','2026-08-11 12:55:28.785',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf');
/*!40000 ALTER TABLE `taxes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_feature_overrides`
--

DROP TABLE IF EXISTS `tenant_feature_overrides`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tenant_feature_overrides` (
  `id` varchar(191) NOT NULL,
  `companyId` varchar(191) NOT NULL,
  `branchId` varchar(191) DEFAULT NULL,
  `featureKey` varchar(191) NOT NULL,
  `enabled` tinyint(1) NOT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tenant_feature_overrides_companyId_featureKey_key` (`companyId`,`featureKey`),
  KEY `tenant_feature_overrides_companyId_idx` (`companyId`),
  KEY `tenant_feature_overrides_branchId_fkey` (`branchId`),
  KEY `tenant_feature_overrides_featureKey_fkey` (`featureKey`),
  CONSTRAINT `tenant_feature_overrides_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `tenant_feature_overrides_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `tenant_feature_overrides_featureKey_fkey` FOREIGN KEY (`featureKey`) REFERENCES `feature_flags` (`key`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_feature_overrides`
--

LOCK TABLES `tenant_feature_overrides` WRITE;
/*!40000 ALTER TABLE `tenant_feature_overrides` DISABLE KEYS */;
INSERT INTO `tenant_feature_overrides` VALUES ('0b297802-827c-4f15-be18-539c3c50dd23','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'calendar.holiday',1,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.349'),('0deba872-39fe-4547-872e-c7a1a2123b29','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'reception.manual_student_conversion',1,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.276'),('15796694-99e8-4c9a-9a37-6207e649a759','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'reception.queue_analytics',0,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.306'),('16a7cd02-61a0-4a23-85df-b617caf28a85','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'calendar.task',1,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.343'),('171cd30e-a432-4b86-94d0-ae8985dae44c','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'reception.manual_appointment',1,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.273'),('18fb9d8f-3cef-4a35-89b5-6137c0d372e9','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'calendar.leave',1,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.353'),('26a6b6d1-0116-48b4-a2e1-b04e7d6b8e62','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'reporting.kpi',0,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.412'),('295af34a-8e90-4cba-b4af-346f833b00ed','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'reporting.analytics',0,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.416'),('37b1a5cd-c220-4168-a8ea-dfa988eaad25','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'calendar.automatic',1,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.326'),('4b4e0679-d07c-40f0-9898-24c9dbb12c3d','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'automation.auto_followup',0,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.374'),('4d919323-61c5-4b2e-a9a7-390281250a01','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'reception.waiting_area',0,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.283'),('4e8956b1-41e7-4c23-aa47-c9a36c93eff3','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'communication.push_notification',0,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.385'),('4f690e44-aea3-4ec9-8e46-eb133e82d59f','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'reception.walk_in_queue',0,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.309'),('570a9dbe-dadf-45ad-b22f-0a02c6b8a7d3','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'reception.interested_register',1,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.267'),('6036a997-d871-4db3-8105-34f7f5e08178','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'reception.token_system',0,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.288'),('6098a033-14ce-4eb1-a78c-c4c53344682c','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'reception.auto_token',0,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.291'),('6bb9bd3d-49c2-41d4-a50f-3f066773d6c3','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'reception.auto_counsellor_assignment',0,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.295'),('74a1766f-5d9b-4d63-8eab-464d7bd4ee2f','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'finance.due_reminder',0,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.403'),('759cd9ee-64dc-4a6a-b5ad-78618cb8ba40','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'reception.counsellor_availability',0,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.298'),('8426194f-71fe-482b-9e4a-0f9d43abf633','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'reception.queue_display_screen',0,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.302'),('8a0b92f0-2cce-4a7e-9be2-f5b39f0f54d9','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'reception.whatsapp_token',0,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.316'),('8b14f499-e200-4c78-97ba-9ceb3d00b1b2','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'reception.auto_check_in',0,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.320'),('8d6833e5-f61f-465a-b6c9-fb7aec725cd0','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'communication.announcement',0,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.390'),('8ff2e41f-4387-4b46-bf5f-34603e850db4','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'finance.payment_reminder',0,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.399'),('9e62a326-47f5-4df7-b19b-1e5ee53ac1fe','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'reception.manual_counsellor_selection',1,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.270'),('b0a18fe0-3b4b-453e-a276-2636ebcce955','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'automation.auto_reminder',0,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.370'),('b10ca6f0-d6a1-4609-939f-ab6dc9508a5d','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'automation.sms',0,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.361'),('b2282c4d-e387-43cf-a03d-c6332ab12ad4','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'reporting.dashboard',1,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.408'),('c82c9345-3976-4332-bbcf-91a9ed64d3ab','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'reception.register',1,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.260'),('d1aeb2da-0868-4da7-970f-b2276eb6158f','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'automation.whatsapp',0,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.366'),('d2aad561-569d-4cb9-8cca-c990d1e037c2','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'communication.internal_chat',0,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.381'),('dadcfc2e-5d5b-4fbd-9380-b4f6d3751d1a','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'calendar.manual',1,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.323'),('e1e34e20-9dfe-4d3e-bc9f-8fb30d3dbe40','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'reception.sms_token',0,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.312'),('e23e5bb4-4fdb-4519-98af-3b5608681482','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'finance.invoice',0,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.394'),('e7e1ff1f-637b-458a-af41-1acdf46cb28d','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'automation.notification_engine',0,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.377'),('eb41ba4f-f5f4-428c-91a9-d86a83571b07','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'automation.email',0,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.357'),('f3d79ea0-90e0-443a-814c-30536e5b4048','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'reception.live_queue',0,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.278'),('fb29ad0f-4741-4390-8dea-5baa58ff6d7f','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'calendar.reminder',1,'f16e56db-fd62-4993-a487-7fb5906e5caf','2026-07-04 06:34:53.332');
/*!40000 ALTER TABLE `tenant_feature_overrides` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `universities`
--

DROP TABLE IF EXISTS `universities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `universities` (
  `id` varchar(191) NOT NULL,
  `companyId` varchar(191) NOT NULL,
  `countryId` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `city` varchar(191) DEFAULT NULL,
  `state` varchar(191) DEFAULT NULL,
  `website` varchar(191) DEFAULT NULL,
  `ranking` int(11) DEFAULT NULL,
  `universityType` varchar(191) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `universities_companyId_code_key` (`companyId`,`code`),
  KEY `universities_companyId_idx` (`companyId`),
  KEY `universities_countryId_idx` (`countryId`),
  KEY `universities_isActive_idx` (`isActive`),
  CONSTRAINT `universities_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `universities_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `countries` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `universities`
--

LOCK TABLES `universities` WRITE;
/*!40000 ALTER TABLE `universities` DISABLE KEYS */;
INSERT INTO `universities` VALUES ('030e42e3-febb-4ed5-9e48-9528ed914613','a7c7c0df-60c6-4a73-88d0-92b2fa521655','62a01f5f-05df-43f3-a430-8539fad67e22','UNIV_MANCHESTER','University of Manchester','Manchester',NULL,NULL,NULL,NULL,NULL,1,7,'2026-08-11 12:55:29.147','2026-08-11 12:55:29.147',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('0b7f380c-a0b4-476f-878a-b8ddd440a4aa','a7c7c0df-60c6-4a73-88d0-92b2fa521655','863cd63d-2281-4b42-80c8-9fa3ac3e2e89','UNIV_TUM','Technical University of Munich','Munich',NULL,NULL,NULL,NULL,NULL,1,18,'2026-08-11 12:55:29.192','2026-08-11 12:55:29.192',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('1d9ee59c-049a-4ffc-a5b2-ed4ea05786ee','a7c7c0df-60c6-4a73-88d0-92b2fa521655','863cd63d-2281-4b42-80c8-9fa3ac3e2e89','UNIV_HEIDELBERG','Heidelberg University','Heidelberg',NULL,NULL,NULL,NULL,NULL,1,19,'2026-08-11 12:55:29.195','2026-08-11 12:55:29.195',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('2167f164-92a8-46c6-b384-140cf81475cc','a7c7c0df-60c6-4a73-88d0-92b2fa521655','2b197c8e-c7f1-4215-92c1-2fd89b21d4ae','UNIV_MONASH','Monash University','Melbourne',NULL,NULL,NULL,NULL,NULL,1,12,'2026-08-11 12:55:29.167','2026-08-11 12:55:29.167',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('364150ce-1107-4758-8d70-dd491032a343','a7c7c0df-60c6-4a73-88d0-92b2fa521655','dd34bffe-780f-44f8-9335-4316700b0b26','UNIV_AUCKLAND','University of Auckland','Auckland',NULL,NULL,NULL,NULL,NULL,1,21,'2026-08-11 12:55:29.202','2026-08-11 12:55:29.202',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('45387156-d233-427c-b370-b37366ee8898','a7c7c0df-60c6-4a73-88d0-92b2fa521655','4b35383b-2fc4-40bc-8592-e19b9cf04222','UNIV_UBC','University of British Columbia','Vancouver',NULL,NULL,NULL,NULL,NULL,1,2,'2026-08-11 12:55:29.125','2026-08-11 12:55:29.125',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('5796f0fb-e8c1-4c64-9d22-d5c074358c03','a7c7c0df-60c6-4a73-88d0-92b2fa521655','6062255c-4a0c-41b9-ba12-35111e6325fe','UNIV_UCD','University College Dublin','Dublin',NULL,NULL,NULL,NULL,NULL,1,20,'2026-08-11 12:55:29.199','2026-08-11 12:55:29.199',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('62ca23c4-f78f-4685-8cbe-b04d1039d72b','a7c7c0df-60c6-4a73-88d0-92b2fa521655','4b35383b-2fc4-40bc-8592-e19b9cf04222','UNIV_YORK','York University','Toronto',NULL,NULL,NULL,NULL,NULL,1,5,'2026-08-11 12:55:29.140','2026-08-11 12:55:29.140',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('6676642f-d48e-4411-b73e-3173d38d5a56','a7c7c0df-60c6-4a73-88d0-92b2fa521655','62a01f5f-05df-43f3-a430-8539fad67e22','UNIV_COVENTRY','Coventry University','Coventry',NULL,NULL,NULL,NULL,NULL,1,9,'2026-08-11 12:55:29.156','2026-08-11 12:55:29.156',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('759f5a9d-2a01-4b81-892b-82a1ffff17ab','a7c7c0df-60c6-4a73-88d0-92b2fa521655','2b197c8e-c7f1-4215-92c1-2fd89b21d4ae','UNIV_UNSW','UNSW Sydney','Sydney',NULL,NULL,NULL,NULL,NULL,1,14,'2026-08-11 12:55:29.176','2026-08-11 12:55:29.176',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('8cdb5e14-8dcc-437a-89e5-886b208b577c','a7c7c0df-60c6-4a73-88d0-92b2fa521655','b124086d-33e9-494f-8794-58f4a6e03072','UNIV_HARVARD','Harvard University','Cambridge',NULL,NULL,NULL,NULL,NULL,1,15,'2026-08-11 12:55:29.179','2026-08-11 12:55:29.179',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('9073e47b-84ec-4b5e-b2d7-7d9d1f98a2ac','a7c7c0df-60c6-4a73-88d0-92b2fa521655','b124086d-33e9-494f-8794-58f4a6e03072','UNIV_STANFORD','Stanford University','Stanford',NULL,NULL,NULL,NULL,NULL,1,16,'2026-08-11 12:55:29.183','2026-08-11 12:55:29.183',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('94618ce9-6bb9-4e97-a41d-003bdb93e0f9','a7c7c0df-60c6-4a73-88d0-92b2fa521655','cfffb8e3-22dd-4cf2-a842-f2093f32973e','UNIV_SORBONNE','Sorbonne University','Paris',NULL,NULL,NULL,NULL,NULL,1,23,'2026-08-11 12:55:29.211','2026-08-11 12:55:29.211',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('a00e2716-5d00-44d8-9161-5b5bf0d0f410','a7c7c0df-60c6-4a73-88d0-92b2fa521655','b124086d-33e9-494f-8794-58f4a6e03072','UNIV_NYU','New York University','New York',NULL,NULL,NULL,NULL,NULL,1,17,'2026-08-11 12:55:29.186','2026-08-11 12:55:29.186',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('a72af79c-144c-490a-a41f-86df0306b2f0','a7c7c0df-60c6-4a73-88d0-92b2fa521655','4b35383b-2fc4-40bc-8592-e19b9cf04222','UNIV_MCGILL','McGill University','Montreal',NULL,NULL,NULL,NULL,NULL,1,3,'2026-08-11 12:55:29.131','2026-08-11 12:55:29.131',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('aaa09c9f-f6de-43d3-89e3-f0b8c50ad8dc','a7c7c0df-60c6-4a73-88d0-92b2fa521655','e2fc5574-4d75-407a-b076-e6fd9d126d45','UNIV_AMSTERDAM','University of Amsterdam','Amsterdam',NULL,NULL,NULL,NULL,NULL,1,24,'2026-08-11 12:55:29.215','2026-08-11 12:55:29.215',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('adc91527-06e0-45cc-a5a8-055d76903bd2','a7c7c0df-60c6-4a73-88d0-92b2fa521655','62a01f5f-05df-43f3-a430-8539fad67e22','UNIV_BIRMINGHAM','University of Birmingham','Birmingham',NULL,NULL,NULL,NULL,NULL,1,8,'2026-08-11 12:55:29.151','2026-08-11 12:55:29.151',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('bd37ebf1-bb11-4493-bcb5-55537389368a','a7c7c0df-60c6-4a73-88d0-92b2fa521655','2b197c8e-c7f1-4215-92c1-2fd89b21d4ae','UNIV_MELBOURNE','University of Melbourne','Melbourne',NULL,NULL,NULL,NULL,NULL,1,11,'2026-08-11 12:55:29.164','2026-08-11 12:55:29.164',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('cdf06af2-3ac1-41ba-901a-b531775f8248','a7c7c0df-60c6-4a73-88d0-92b2fa521655','10ed19e8-91f6-4c4d-bba9-603ece0ae33e','UNIV_NUS','National University of Singapore','Singapore',NULL,NULL,NULL,NULL,NULL,1,22,'2026-08-11 12:55:29.207','2026-08-11 12:55:29.207',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('ce2fc06c-cee0-4613-b990-703f2c5f3d30','a7c7c0df-60c6-4a73-88d0-92b2fa521655','53bed249-19d8-405d-9731-33838c0a3ed2','UNIV_MALAYA','University of Malaya','Kuala Lumpur',NULL,NULL,NULL,NULL,NULL,1,25,'2026-08-11 12:55:29.218','2026-08-11 12:55:29.218',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('d21ce12c-2f24-4971-aa51-20dc73983ca7','a7c7c0df-60c6-4a73-88d0-92b2fa521655','2b197c8e-c7f1-4215-92c1-2fd89b21d4ae','UNIV_SYDNEY','University of Sydney','Sydney',NULL,NULL,NULL,NULL,NULL,1,13,'2026-08-11 12:55:29.171','2026-08-11 12:55:29.171',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('d83b2580-8de4-4e02-8ec8-3040c5426389','a7c7c0df-60c6-4a73-88d0-92b2fa521655','62a01f5f-05df-43f3-a430-8539fad67e22','UNIV_LEEDS','University of Leeds','Leeds',NULL,NULL,NULL,NULL,NULL,1,10,'2026-08-11 12:55:29.160','2026-08-11 12:55:29.160',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('e73054b1-778a-4371-b5e6-ea3c3702222d','a7c7c0df-60c6-4a73-88d0-92b2fa521655','4b35383b-2fc4-40bc-8592-e19b9cf04222','UNIV_TORONTO','University of Toronto','Toronto',NULL,NULL,NULL,NULL,NULL,1,1,'2026-08-11 12:55:29.118','2026-08-11 12:55:29.118',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('f771458e-4854-48ad-a4ee-ef485e35879e','a7c7c0df-60c6-4a73-88d0-92b2fa521655','4b35383b-2fc4-40bc-8592-e19b9cf04222','UNIV_ALBERTA','University of Alberta','Edmonton',NULL,NULL,NULL,NULL,NULL,1,4,'2026-08-11 12:55:29.135','2026-08-11 12:55:29.135',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('f9947934-7236-429d-9467-4475d1ef06ed','a7c7c0df-60c6-4a73-88d0-92b2fa521655','4b35383b-2fc4-40bc-8592-e19b9cf04222','UNIV_CONCORDIA','Concordia University','Montreal',NULL,NULL,NULL,NULL,NULL,1,6,'2026-08-11 12:55:29.144','2026-08-11 12:55:29.144',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf');
/*!40000 ALTER TABLE `universities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_permission_overrides`
--

DROP TABLE IF EXISTS `user_permission_overrides`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_permission_overrides` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `permissionId` varchar(191) NOT NULL,
  `granted` tinyint(1) NOT NULL DEFAULT 1,
  `expiresAt` datetime(3) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `createdBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_permission_overrides_userId_permissionId_key` (`userId`,`permissionId`),
  KEY `user_permission_overrides_permissionId_fkey` (`permissionId`),
  CONSTRAINT `user_permission_overrides_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `user_permission_overrides_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_permission_overrides`
--

LOCK TABLES `user_permission_overrides` WRITE;
/*!40000 ALTER TABLE `user_permission_overrides` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_permission_overrides` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` varchar(191) NOT NULL,
  `companyId` varchar(191) DEFAULT NULL,
  `branchId` varchar(191) DEFAULT NULL,
  `roleId` varchar(191) NOT NULL,
  `firstName` varchar(191) NOT NULL,
  `lastName` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `avatar` varchar(191) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  `lastLoginAt` datetime(3) DEFAULT NULL,
  `preferences` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`preferences`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`),
  KEY `users_email_idx` (`email`),
  KEY `users_companyId_idx` (`companyId`),
  KEY `users_branchId_idx` (`branchId`),
  KEY `users_roleId_idx` (`roleId`),
  CONSTRAINT `users_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('f16e56db-fd62-4993-a487-7fb5906e5caf','a7c7c0df-60c6-4a73-88d0-92b2fa521655','caabc1ee-3ff0-496c-802a-746bbbbae703','e6d7c8a5-12a8-40d9-9434-8aff5e00d7ee','Super','Admin','admin@crm.com','$2a$12$K/YyZPAz.geiKv7xgwxdWewoeJy2.u0jltNS2FfH0Faj5UgUdgakS',NULL,NULL,'ACTIVE','2026-08-12 05:49:27.558','{}','2026-07-04 06:34:53.224','2026-08-12 05:49:27.559',NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visa_types`
--

DROP TABLE IF EXISTS `visa_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `visa_types` (
  `id` varchar(191) NOT NULL,
  `companyId` varchar(191) NOT NULL,
  `countryId` varchar(191) DEFAULT NULL,
  `code` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `category` varchar(191) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `processingTime` varchar(191) DEFAULT NULL,
  `fee` decimal(14,2) DEFAULT NULL,
  `currencyCode` varchar(191) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `visa_types_companyId_code_key` (`companyId`,`code`),
  KEY `visa_types_companyId_idx` (`companyId`),
  KEY `visa_types_countryId_idx` (`countryId`),
  KEY `visa_types_isActive_idx` (`isActive`),
  CONSTRAINT `visa_types_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `visa_types_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `countries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visa_types`
--

LOCK TABLES `visa_types` WRITE;
/*!40000 ALTER TABLE `visa_types` DISABLE KEYS */;
INSERT INTO `visa_types` VALUES ('21d02ce1-cecc-4ad3-b23b-19960b9c6be0','a7c7c0df-60c6-4a73-88d0-92b2fa521655','863cd63d-2281-4b42-80c8-9fa3ac3e2e89','NATIONAL_D_DE','National Visa D (Germany)','Student',NULL,NULL,NULL,NULL,1,5,'2026-08-11 12:55:29.399','2026-08-11 12:55:29.399',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('340984ec-04d0-4ed6-89b9-3d357e6befb3','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'WORK_PERMIT','Work Permit','Work',NULL,NULL,NULL,NULL,1,13,'2026-08-11 12:55:29.431','2026-08-11 12:55:29.431',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('34d4acde-c986-4c3a-a330-4ed0eb81ed15','a7c7c0df-60c6-4a73-88d0-92b2fa521655','10ed19e8-91f6-4c4d-bba9-603ece0ae33e','STUDENT_PASS_SG','Student Pass (Singapore)','Student',NULL,NULL,NULL,NULL,1,10,'2026-08-11 12:55:29.419','2026-08-11 12:55:29.419',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('48599a9a-d516-45f9-ae9d-a5a8edd0be9e','a7c7c0df-60c6-4a73-88d0-92b2fa521655','e2fc5574-4d75-407a-b076-e6fd9d126d45','STUDENT_VISA_NL','Student Visa (Netherlands)','Student',NULL,NULL,NULL,NULL,1,9,'2026-08-11 12:55:29.415','2026-08-11 12:55:29.415',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('4d01c4a2-3116-4511-a052-c85556dae77c','a7c7c0df-60c6-4a73-88d0-92b2fa521655','b124086d-33e9-494f-8794-58f4a6e03072','F1_US','F-1 Student Visa (USA)','Student',NULL,NULL,NULL,NULL,1,4,'2026-08-11 12:55:29.395','2026-08-11 12:55:29.395',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('6d18956b-b1ea-4b25-b9d0-197a2938c45f','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'DEPENDENT','Dependent Visa','Dependent',NULL,NULL,NULL,NULL,1,11,'2026-08-11 12:55:29.424','2026-08-11 12:55:29.424',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('73b4dcad-8383-49b5-8b47-cb41ca2fc107','a7c7c0df-60c6-4a73-88d0-92b2fa521655','dd34bffe-780f-44f8-9335-4316700b0b26','STUDENT_VISA_NZ','Student Visa (New Zealand)','Student',NULL,NULL,NULL,NULL,1,6,'2026-08-11 12:55:29.403','2026-08-11 12:55:29.403',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('897abf45-14a4-43ea-84e4-e303b692b6fb','a7c7c0df-60c6-4a73-88d0-92b2fa521655','4b35383b-2fc4-40bc-8592-e19b9cf04222','STUDY_PERMIT_CA','Study Permit (Canada)','Student',NULL,NULL,NULL,NULL,1,1,'2026-08-11 12:55:29.379','2026-08-11 12:55:29.379',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('a4f78c5c-3301-4f4b-b675-7c80b939b007','a7c7c0df-60c6-4a73-88d0-92b2fa521655',NULL,'TOURIST','Tourist Visa','Visit',NULL,NULL,NULL,NULL,1,12,'2026-08-11 12:55:29.428','2026-08-11 12:55:29.428',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('a84ff737-aca1-4a4d-a971-0de1c2161903','a7c7c0df-60c6-4a73-88d0-92b2fa521655','cfffb8e3-22dd-4cf2-a842-f2093f32973e','STUDENT_VISA_FR','Student Visa (France)','Student',NULL,NULL,NULL,NULL,1,8,'2026-08-11 12:55:29.412','2026-08-11 12:55:29.412',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('c997188f-d4db-41fe-bafb-e6a175aaa940','a7c7c0df-60c6-4a73-88d0-92b2fa521655','6062255c-4a0c-41b9-ba12-35111e6325fe','STAMP2_IE','Stamp 2 (Ireland)','Student',NULL,NULL,NULL,NULL,1,7,'2026-08-11 12:55:29.408','2026-08-11 12:55:29.408',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('ce6debb0-3990-468b-9bc9-3fa87dbd7a1c','a7c7c0df-60c6-4a73-88d0-92b2fa521655','62a01f5f-05df-43f3-a430-8539fad67e22','STUDENT_VISA_UK','Student Visa (UK)','Student',NULL,NULL,NULL,NULL,1,2,'2026-08-11 12:55:29.384','2026-08-11 12:55:29.384',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('fc39cdce-b7bd-4869-8059-68bb4f1800f3','a7c7c0df-60c6-4a73-88d0-92b2fa521655','2b197c8e-c7f1-4215-92c1-2fd89b21d4ae','STUDENT_VISA_AU','Student Visa (Australia)','Student',NULL,NULL,NULL,NULL,1,3,'2026-08-11 12:55:29.392','2026-08-11 12:55:29.392',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf');
/*!40000 ALTER TABLE `visa_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visas`
--

DROP TABLE IF EXISTS `visas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `visas` (
  `id` varchar(191) NOT NULL,
  `studentId` varchar(191) NOT NULL,
  `country` varchar(191) NOT NULL,
  `visaType` varchar(191) DEFAULT NULL,
  `status` enum('NOT_STARTED','DOCUMENTS_COLLECTED','APPLICATION_SUBMITTED','BIOMETRICS_DONE','INTERVIEW_SCHEDULED','APPROVED','REJECTED','APPEAL') NOT NULL DEFAULT 'NOT_STARTED',
  `applicationNo` varchar(191) DEFAULT NULL,
  `submittedAt` datetime(3) DEFAULT NULL,
  `decisionAt` datetime(3) DEFAULT NULL,
  `expiryDate` datetime(3) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `visas_studentId_idx` (`studentId`),
  KEY `visas_status_idx` (`status`),
  CONSTRAINT `visas_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visas`
--

LOCK TABLES `visas` WRITE;
/*!40000 ALTER TABLE `visas` DISABLE KEYS */;
/*!40000 ALTER TABLE `visas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visit_purposes`
--

DROP TABLE IF EXISTS `visit_purposes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `visit_purposes` (
  `id` varchar(191) NOT NULL,
  `companyId` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `visit_purposes_companyId_code_key` (`companyId`,`code`),
  KEY `visit_purposes_companyId_idx` (`companyId`),
  KEY `visit_purposes_isActive_idx` (`isActive`),
  CONSTRAINT `visit_purposes_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visit_purposes`
--

LOCK TABLES `visit_purposes` WRITE;
/*!40000 ALTER TABLE `visit_purposes` DISABLE KEYS */;
INSERT INTO `visit_purposes` VALUES ('04fae6eb-358f-4464-b6e4-90f9819388e5','a7c7c0df-60c6-4a73-88d0-92b2fa521655','ENQUIRY','Enquiry',NULL,1,1,'2026-08-11 12:55:28.802','2026-08-11 12:55:28.802',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('6b2270cc-97c2-4708-b5e1-4cf00b0657a0','a7c7c0df-60c6-4a73-88d0-92b2fa521655','ADMISSION','Admission',NULL,1,3,'2026-08-11 12:55:28.814','2026-08-11 12:55:28.814',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('7e412451-8399-431a-a2f7-147dba70e964','a7c7c0df-60c6-4a73-88d0-92b2fa521655','FOLLOW_UP','Follow-up',NULL,1,7,'2026-08-11 12:55:28.830','2026-08-11 12:55:28.830',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('852e2b98-e6be-4e79-8050-eb3130fad067','a7c7c0df-60c6-4a73-88d0-92b2fa521655','DOCUMENT_SUBMISSION','Document Submission',NULL,1,4,'2026-08-11 12:55:28.817','2026-08-11 12:55:28.817',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('a6ec7424-7c7a-465d-90fe-8b106fc86f2f','a7c7c0df-60c6-4a73-88d0-92b2fa521655','GENERAL','General',NULL,1,8,'2026-08-11 12:55:28.833','2026-08-11 12:55:28.833',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('acabcb34-3bd0-49e7-8de0-0f2ea3b126e6','a7c7c0df-60c6-4a73-88d0-92b2fa521655','VISA_CONSULTATION','Visa Consultation',NULL,1,5,'2026-08-11 12:55:28.822','2026-08-11 12:55:28.822',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('b85fb10c-d5e1-4c41-985a-b52739e2114c','a7c7c0df-60c6-4a73-88d0-92b2fa521655','COUNSELLING','Counselling',NULL,1,2,'2026-08-11 12:55:28.808','2026-08-11 12:55:28.808',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf'),('bc4fca58-9011-4377-bbe1-cab0a1cc9020','a7c7c0df-60c6-4a73-88d0-92b2fa521655','PAYMENT','Payment',NULL,1,6,'2026-08-11 12:55:28.826','2026-08-11 12:55:28.826',NULL,'f16e56db-fd62-4993-a487-7fb5906e5caf','f16e56db-fd62-4993-a487-7fb5906e5caf');
/*!40000 ALTER TABLE `visit_purposes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'lead_management_crm'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-12 11:58:09
