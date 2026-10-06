import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildQuery, executePaginatedQuery } from '../utils/queryBuilder.js';
import { generateUniqueSlug } from '../utils/slugify.js';
import { HTTP_STATUS, ROLES } from '../config/constants.js';

const BASE_ALLOWED_SORT_FIELDS = [
  'name',
  'ratingAverage',
  'ratingCount',
  'createdAt'
];

/**
 * Creates standardized CRUD controller methods for a healthcare facility model.
 *
 * @param {import('mongoose').Model} Model
 * @param {string} resourceName - Plural name for response messages (e.g., 'Clinics')
 * @param {Function} [customFilterParser] - Callback to parse entity-specific query filters
 * @param {string|object} [defaultPopulate=null] - Populate options
 */
export function createFacilityController(
  Model,
  resourceName,
  customFilterParser = null,
  defaultPopulate = null
) {
  const getList = asyncHandler(async (req, res) => {
    const isAdmin = req.user && req.user.role === ROLES.ADMIN;
    const includeInactive = isAdmin && req.query.includeInactive === 'true';

    const baseFilter = {};
    if (!includeInactive) {
      baseFilter.isActive = true;
    }

    if (req.query.area) {
      baseFilter.area = new RegExp(`^${req.query.area}$`, 'i');
    }

    if (req.query.isVerified !== undefined) {
      baseFilter.isVerified = req.query.isVerified === 'true';
    }

    if (req.query.is24Hours !== undefined) {
      baseFilter.is24Hours = req.query.is24Hours === 'true';
    }

    if (req.query.isEmergency !== undefined) {
      baseFilter.isEmergency = req.query.isEmergency === 'true';
    }

    if (req.query.minRating !== undefined) {
      const minRating = parseFloat(req.query.minRating);
      if (!isNaN(minRating)) {
        baseFilter.ratingAverage = { $gte: minRating };
      }
    }

    // Apply entity-specific filters if provided
    if (typeof customFilterParser === 'function') {
      customFilterParser(req.query, baseFilter);
    }

    const queryOptions = buildQuery({
      query: req.query,
      allowedSortFields: BASE_ALLOWED_SORT_FIELDS,
      defaultSort: '-ratingAverage,name',
      searchFields: ['name', 'description', 'services', 'area'],
      baseFilter
    });

    const { docs, meta } = await executePaginatedQuery(
      Model,
      queryOptions,
      defaultPopulate
    );

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      `${resourceName} fetched successfully`,
      docs.map((d) => d.toJSON()),
      meta
    );
  });

  const getByIdOrSlug = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { slug: id };

    let queryPromise = Model.findOne(query);
    if (defaultPopulate) {
      queryPromise = queryPromise.populate(defaultPopulate);
    }

    const doc = await queryPromise;
    if (!doc) {
      throw ApiError.notFound(`${resourceName.slice(0, -1)} not found`);
    }

    const isAdmin = req.user && req.user.role === ROLES.ADMIN;
    if (!isAdmin && !doc.isActive) {
      throw ApiError.notFound(`${resourceName.slice(0, -1)} not found or inactive`);
    }

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      `${resourceName.slice(0, -1)} details fetched successfully`,
      doc.toJSON()
    );
  });

  const create = asyncHandler(async (req, res) => {
    const slug = await generateUniqueSlug(Model, req.body.name);
    const doc = await Model.create({
      ...req.body,
      slug
    });

    return sendSuccess(
      res,
      HTTP_STATUS.CREATED,
      `${resourceName.slice(0, -1)} created successfully`,
      doc.toJSON()
    );
  });

  const update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { slug: id };

    const doc = await Model.findOne(query);
    if (!doc) {
      throw ApiError.notFound(`${resourceName.slice(0, -1)} not found`);
    }

    const updates = { ...req.body };
    if (updates.name && updates.name !== doc.name) {
      updates.slug = await generateUniqueSlug(Model, updates.name, doc._id);
    }

    Object.assign(doc, updates);
    await doc.save();

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      `${resourceName.slice(0, -1)} updated successfully`,
      doc.toJSON()
    );
  });

  const remove = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { slug: id };

    const doc = await Model.findOneAndDelete(query);
    if (!doc) {
      throw ApiError.notFound(`${resourceName.slice(0, -1)} not found`);
    }

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      `${resourceName.slice(0, -1)} deleted successfully`,
      null
    );
  });

  return {
    getList,
    getByIdOrSlug,
    create,
    update,
    remove
  };
}

export default createFacilityController;
