import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { TouristCategory, TransportType, WasteCategory, WasteStatus, PestReportType, EventCategory } from '@prisma/client';

// ==================== TOURISM ====================
export const getTouristPlaces = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.query;
    const filter = category ? { category: category as TouristCategory } : {};

    const places = await prisma.touristPlace.findMany({
      where: filter,
      orderBy: { ratingAvg: 'desc' },
    });

    return res.json(places);
  } catch (error) {
    next(error);
  }
};

export const createTouristPlace = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, category, address, latitude, longitude, imageUrls } = req.body;
    const place = await prisma.touristPlace.create({
      data: {
        name,
        description,
        category: category as TouristCategory,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        imageUrls: imageUrls || [],
      },
    });
    return res.status(201).json(place);
  } catch (error) {
    next(error);
  }
};

// ==================== PUBLIC TRANSPORT ====================
export const getTransportStations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.query;
    const filter = type ? { type: type as TransportType } : {};

    const transport = await prisma.transport.findMany({
      where: filter,
      orderBy: { name: 'asc' },
    });
    return res.json(transport);
  } catch (error) {
    next(error);
  }
};

export const createTransportStation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, type, code, routeDetails, latitude, longitude } = req.body;
    const station = await prisma.transport.create({
      data: {
        name,
        type: type as TransportType,
        code,
        routeDetails: routeDetails || {},
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
    });
    return res.status(201).json(station);
  } catch (error) {
    next(error);
  }
};

// ==================== WASTE MANAGEMENT ====================
export const reportWaste = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { category, description, latitude, longitude, photoUrl } = req.body;

    const report = await prisma.wasteReport.create({
      data: {
        category: category as WasteCategory,
        description,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        photoUrl,
        citizenId: req.user!.id,
      },
    });
    return res.status(201).json(report);
  } catch (error) {
    next(error);
  }
};

export const getWasteReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reports = await prisma.wasteReport.findMany({
      include: {
        citizen: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(reports);
  } catch (error) {
    next(error);
  }
};

// ==================== PEST CONTROL ====================
export const reportPestBreeding = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, latitude, longitude, areaName, reportType } = req.body;

    const report = await prisma.pestReport.create({
      data: {
        title,
        description,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        areaName,
        reportType: reportType as PestReportType,
        reporterId: req.user!.id,
      },
    });
    return res.status(201).json(report);
  } catch (error) {
    next(error);
  }
};

export const getPestReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reports = await prisma.pestReport.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json(reports);
  } catch (error) {
    next(error);
  }
};

// ==================== COMMUNITY EVENTS ====================
export const createEvent = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, category, startDate, endDate, location, latitude, longitude, maxVolunteers } = req.body;

    const event = await prisma.event.create({
      data: {
        title,
        description,
        category: category as EventCategory,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        maxVolunteers: parseInt(maxVolunteers) || 0,
        createdById: req.user!.id,
      },
    });
    return res.status(201).json(event);
  } catch (error) {
    next(error);
  }
};

export const getEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { startDate: 'asc' },
    });
    return res.json(events);
  } catch (error) {
    next(error);
  }
};
