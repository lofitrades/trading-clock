/**
 * src/services/adminDescriptionsService.js
 *
 * Purpose: Admin CRUD operations for economicEventDescriptions collection
 * Handles fetching, creating, updating, and deleting event descriptions
 * BEP: Full validation, changelog tracking, proper error handling
 * BEP I18N: Multi-language support (EN/ES/FR) with nested i18n structure
 *
 * Changelog:
 * v2.1.0 - 2026-02-02 - Added releaseTime to i18n structure for multi-language release schedule descriptions
 * v2.0.0 - 2026-02-02 - BEP I18N: Added multi-language support with i18n nested structure
 * v1.0.0 - 2026-02-02 - Initial implementation with BEP standards
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION_NAME = 'economicEventDescriptions';

/** Supported languages for event descriptions */
export const SUPPORTED_DESCRIPTION_LANGUAGES = ['en', 'es', 'fr'];
export const DEFAULT_DESCRIPTION_LANGUAGE = 'en';

/**
 * Get localized description content with EN fallback
 * BEP I18N: Returns localized content from i18n structure, falling back to EN or legacy fields
 * 
 * @param {Object} desc - Full description object
 * @param {string} lang - Target language (en, es, fr)
 * @returns {Object} Localized description with _language and _hasTranslation flags
 */
export const getLocalizedDescription = (desc, lang = 'en') => {
  if (!desc) return null;
  
  const i18n = desc.i18n || {};
  const targetLang = SUPPORTED_DESCRIPTION_LANGUAGES.includes(lang) ? lang : DEFAULT_DESCRIPTION_LANGUAGE;
  const localized = i18n[targetLang] || i18n[DEFAULT_DESCRIPTION_LANGUAGE] || {};
  
  // Fall back to legacy top-level fields if i18n structure doesn't exist
  const fallbackDescription = localized.description || desc.description || '';
  const fallbackTradingImplication = localized.tradingImplication || desc.tradingImplication || '';
  const fallbackKeyThresholds = localized.keyThresholds || desc.keyThresholds || {};
  const fallbackReleaseTime = localized.releaseTime || desc.releaseTime || '';
  
  return {
    ...desc,
    description: fallbackDescription,
    tradingImplication: fallbackTradingImplication,
    keyThresholds: fallbackKeyThresholds,
    releaseTime: fallbackReleaseTime,
    _language: i18n[targetLang] ? targetLang : (i18n[DEFAULT_DESCRIPTION_LANGUAGE] ? DEFAULT_DESCRIPTION_LANGUAGE : null),
    _hasTranslation: Boolean(i18n[targetLang]),
    _translationStatus: getTranslationStatus(desc),
  };
};

/**
 * Get translation status for all supported languages
 * @param {Object} desc - Description object
 * @returns {Object} Status for each language { en: 'complete', es: 'partial', fr: 'missing' }
 */
export const getTranslationStatus = (desc) => {
  if (!desc) return {};
  
  const i18n = desc.i18n || {};
  const status = {};
  
  SUPPORTED_DESCRIPTION_LANGUAGES.forEach(lang => {
    const content = i18n[lang] || {};
    const hasDescription = Boolean(content.description?.trim());
    const hasTradingImplication = Boolean(content.tradingImplication?.trim());
    const hasKeyThresholds = content.keyThresholds && Object.keys(content.keyThresholds).length > 0;
    const hasReleaseTime = Boolean(content.releaseTime?.trim());
    
    // For legacy data without i18n structure, check top-level fields for EN
    if (lang === 'en' && !i18n[lang]) {
      const legacyHasDesc = Boolean(desc.description?.trim());
      const legacyHasTrading = Boolean(desc.tradingImplication?.trim());
      const legacyHasThresholds = desc.keyThresholds && Object.keys(desc.keyThresholds).length > 0;
      const legacyHasReleaseTime = Boolean(desc.releaseTime?.trim());
      
      const fields = [legacyHasDesc, legacyHasTrading, legacyHasThresholds, legacyHasReleaseTime];
      const filledCount = fields.filter(Boolean).length;
      
      if (filledCount >= 3) {
        status[lang] = 'complete';
      } else if (filledCount >= 1) {
        status[lang] = 'partial';
      } else {
        status[lang] = 'missing';
      }
      return;
    }
    
    const fields = [hasDescription, hasTradingImplication, hasKeyThresholds, hasReleaseTime];
    const filledCount = fields.filter(Boolean).length;
    
    if (filledCount >= 3) {
      status[lang] = 'complete';
    } else if (filledCount >= 1) {
      status[lang] = 'partial';
    } else {
      status[lang] = 'missing';
    }
  });
  
  return status;
};

/**
 * Fetch all descriptions with optional filtering
 * @param {Object} filters - Filter criteria
 * @param {string} filters.category - Filter by category
 * @param {string} filters.impact - Filter by impact level
 * @param {string} filters.searchQuery - Search in name and aliases
 * @returns {Promise<Array>} Array of description objects
 */
export const fetchDescriptions = async (filters = {}) => {
  try {
    const { category, impact, searchQuery } = filters;

    const descriptionsRef = collection(db, COLLECTION_NAME);
    let q = query(descriptionsRef, orderBy('name', 'asc'));

    const snapshot = await getDocs(q);

    let descriptions = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      
      // Convert any Firestore Timestamps to ISO strings
      const lastModified = data.lastModified?.toDate 
        ? data.lastModified.toDate().toISOString() 
        : null;
      const createdAt = data.createdAt?.toDate 
        ? data.createdAt.toDate().toISOString() 
        : null;

      // Process changelog entries
      const changelog = (data.changelog || []).map(entry => ({
        ...entry,
        timestamp: entry.timestamp?.toDate 
          ? entry.timestamp.toDate().toISOString() 
          : entry.timestamp,
      }));

      return {
        id: docSnap.id,
        ...data,
        lastModified,
        createdAt,
        changelog,
        // Ensure aliases is always an array
        aliases: data.aliases || [],
        // Ensure keyThresholds is always an object
        keyThresholds: data.keyThresholds || {},
        // Ensure i18n structure exists
        i18n: data.i18n || {},
        // Add translation status for admin UI
        _translationStatus: getTranslationStatus(data),
      };
    });

    // Client-side filtering for flexibility
    if (category) {
      descriptions = descriptions.filter(d => 
        d.category?.toLowerCase() === category.toLowerCase()
      );
    }

    if (impact) {
      descriptions = descriptions.filter(d => 
        d.impact?.toLowerCase() === impact.toLowerCase()
      );
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      descriptions = descriptions.filter(d =>
        d.name?.toLowerCase().includes(lowerQuery) ||
        d.aliases?.some(alias => alias.toLowerCase().includes(lowerQuery)) ||
        d.description?.toLowerCase().includes(lowerQuery)
      );
    }

    return descriptions;
  } catch (error) {
    console.error('❌ [AdminDescriptions] Error fetching descriptions:', error);
    throw new Error('Failed to fetch descriptions: ' + error.message);
  }
};

/**
 * Get a single description by ID
 * @param {string} id - Document ID
 * @returns {Promise<Object>} Description object
 */
export const getDescriptionById = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Description not found');
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      aliases: data.aliases || [],
      keyThresholds: data.keyThresholds || {},
      i18n: data.i18n || {},
      _translationStatus: getTranslationStatus(data),
    };
  } catch (error) {
    console.error('❌ [AdminDescriptions] Error fetching description:', error);
    throw new Error('Failed to fetch description: ' + error.message);
  }
};

/**
 * Create a new description
 * @param {Object} descriptionData - Description data
 * @param {Object} adminUser - Admin user creating the description
 * @returns {Promise<Object>} Created description with ID
 */
export const createDescription = async (descriptionData, adminUser) => {
  try {
    if (!adminUser?.uid || !adminUser?.email) {
      throw new Error('Admin user information required');
    }

    // Validate required fields
    if (!descriptionData.name?.trim()) {
      throw new Error('Event name is required');
    }

    // Generate document ID from normalized name
    const docId = descriptionData.name.toLowerCase().trim().replace(/\s+/g, '-');
    const docRef = doc(db, COLLECTION_NAME, docId);

    // Check if already exists
    const existing = await getDoc(docRef);
    if (existing.exists()) {
      throw new Error('A description with this name already exists');
    }

    // Prepare document data with i18n structure
    // BEP I18N: Store localized content in i18n nested structure
    const newDescription = {
      name: descriptionData.name.trim(),
      aliases: descriptionData.aliases || [],
      category: descriptionData.category || '',
      impact: descriptionData.impact || 'medium',
      frequency: descriptionData.frequency || '',
      releaseTime: descriptionData.releaseTime || '',
      source: descriptionData.source || '',
      // Legacy fields for backward compatibility (EN content)
      description: descriptionData.i18n?.en?.description || descriptionData.description || '',
      tradingImplication: descriptionData.i18n?.en?.tradingImplication || descriptionData.tradingImplication || '',
      keyThresholds: descriptionData.i18n?.en?.keyThresholds || descriptionData.keyThresholds || {},
      // Multi-language content
      i18n: descriptionData.i18n || {
        en: {
          description: descriptionData.description || '',
          tradingImplication: descriptionData.tradingImplication || '',
          keyThresholds: descriptionData.keyThresholds || {},
        },
        es: { description: '', tradingImplication: '', keyThresholds: {} },
        fr: { description: '', tradingImplication: '', keyThresholds: {} },
      },
      createdAt: serverTimestamp(),
      createdBy: adminUser.uid,
      lastModified: serverTimestamp(),
      lastModifiedBy: adminUser.uid,
      changelog: [{
        timestamp: new Date().toISOString(),
        adminUid: adminUser.uid,
        adminEmail: adminUser.email,
        action: 'created',
        reason: 'Initial creation',
      }],
    };

    await setDoc(docRef, newDescription);
    console.log('✅ [AdminDescriptions] Created description:', docId);

    return {
      id: docId,
      ...newDescription,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ [AdminDescriptions] Error creating description:', error);
    throw new Error('Failed to create description: ' + error.message);
  }
};

/**
 * Update a description with changelog tracking
 * @param {string} id - Document ID
 * @param {Object} updates - Fields to update
 * @param {string} reason - Reason for the update
 * @param {Object} adminUser - Admin user making the update
 * @param {Object} originalData - Original data for changelog
 * @returns {Promise<Object>} Success response
 */
export const updateDescription = async (id, updates, reason, adminUser, originalData = {}) => {
  try {
    if (!adminUser?.uid || !adminUser?.email) {
      throw new Error('Admin user information required');
    }

    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Description not found');
    }

    // Build changelog entries for each changed field
    const changelogEntries = Object.keys(updates).map(field => ({
      timestamp: new Date().toISOString(),
      adminUid: adminUser.uid,
      adminEmail: adminUser.email,
      field,
      oldValue: originalData[field] ?? null,
      newValue: updates[field],
      reason: reason || 'Inline edit',
    }));

    // Prepare update payload
    const updatePayload = {
      ...updates,
      lastModified: serverTimestamp(),
      lastModifiedBy: adminUser.uid,
    };

    // Add changelog entries
    changelogEntries.forEach(entry => {
      updatePayload.changelog = arrayUnion(entry);
    });

    await updateDoc(docRef, updatePayload);
    console.log('✅ [AdminDescriptions] Updated description:', id);

    return {
      success: true,
      message: 'Description updated successfully',
    };
  } catch (error) {
    console.error('❌ [AdminDescriptions] Error updating description:', error);
    throw new Error('Failed to update description: ' + error.message);
  }
};

/**
 * Delete a description
 * @param {string} id - Document ID
 * @returns {Promise<Object>} Success response
 */
export const deleteDescription = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    console.log('✅ [AdminDescriptions] Deleted description:', id);

    return {
      success: true,
      message: 'Description deleted successfully',
    };
  } catch (error) {
    console.error('❌ [AdminDescriptions] Error deleting description:', error);
    throw new Error('Failed to delete description: ' + error.message);
  }
};

/**
 * Get all unique categories from descriptions
 * @returns {Promise<Array>} Array of unique category strings
 */
export const getCategories = async () => {
  try {
    const descriptions = await fetchDescriptions();
    const categories = [...new Set(descriptions.map(d => d.category).filter(Boolean))];
    return categories.sort();
  } catch (error) {
    console.error('❌ [AdminDescriptions] Error fetching categories:', error);
    return [];
  }
};

/**
 * Validate description field update
 * @param {string} field - Field name
 * @param {any} value - New value
 * @returns {Object} Validation result
 */
export const validateDescriptionField = (field, value) => {
  switch (field) {
    case 'name':
      if (!value?.trim()) {
        return { valid: false, error: 'Event name is required' };
      }
      break;
    case 'impact':
      if (!['high', 'medium', 'low', 'none'].includes(value?.toLowerCase())) {
        return { valid: false, error: 'Impact must be high, medium, low, or none' };
      }
      break;
    case 'aliases':
      if (!Array.isArray(value)) {
        return { valid: false, error: 'Aliases must be an array' };
      }
      break;
    case 'keyThresholds':
      if (typeof value !== 'object') {
        return { valid: false, error: 'Key thresholds must be an object' };
      }
      break;
  }

  return { valid: true };
};
