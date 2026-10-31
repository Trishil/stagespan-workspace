/**
 * Scoped Multi-Tenant Repository Layer
 * Manages configuration, entitlements, memberships, and operational records
 * scoped strictly to companyId and factoryId.
 */

import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db, auth } from '../firebaseService';
import { FactoryConfiguration, TenantEntitlements, WorkflowVersion } from '../../domain/configuration/types';
import { UserMembership } from '../../domain/permissions/types';
import { ProductionJobRecord } from '../../domain/workflow/quantityEngine';

export interface CompanyRecord {
  id: string;
  name: string;
  code: string;
  ownerEmail: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory tenant-isolated cache to prevent cross-company leakage
const memoryConfigCache: Map<string, FactoryConfiguration> = new Map();
const memoryEntitlementsCache: Map<string, TenantEntitlements> = new Map();
const memoryJobsCache: Map<string, ProductionJobRecord[]> = new Map();

/**
 * Resets all in-memory caches and active listeners.
 * MUST be invoked when switching active company or logging out to guarantee
 * no stale data or cross-tenant state remains.
 */
export function resetTenantMemoryCache(): void {
  memoryConfigCache.clear();
  memoryEntitlementsCache.clear();
  memoryJobsCache.clear();
}

/**
 * Helper to build Firestore path keys
 */
export function getCompanyDocRef(companyId: string) {
  return doc(db, 'companies', companyId);
}

export function getEntitlementsDocRef(companyId: string) {
  return doc(db, 'companies', companyId, 'subscription', 'current');
}

export function getMemberDocRef(companyId: string, userId: string) {
  return doc(db, 'companies', companyId, 'members', userId);
}

export function getFactorySettingsDocRef(companyId: string, factoryId: string) {
  return doc(db, 'companies', companyId, 'factories', factoryId, 'settings', 'current');
}

export function getFactorySetupDraftDocRef(companyId: string, factoryId: string) {
  return doc(db, 'companies', companyId, 'factories', factoryId, 'setup', 'draft');
}

export function getFactoryJobsCollectionRef(companyId: string, factoryId: string) {
  return collection(db, 'companies', companyId, 'factories', factoryId, 'jobs');
}

export const tenantRepository = {
  // 1. Company Metadata
  async getCompany(companyId: string): Promise<CompanyRecord | null> {
    try {
      const snap = await getDoc(getCompanyDocRef(companyId));
      return snap.exists() ? (snap.data() as CompanyRecord) : null;
    } catch (err) {
      console.warn(`[tenantRepository] Failed to get company ${companyId}:`, err);
      return null;
    }
  },

  async saveCompany(company: CompanyRecord): Promise<void> {
    await setDoc(getCompanyDocRef(company.id), company, { merge: true });
  },

  // 2. Entitlements & Subscriptions
  async getEntitlements(companyId: string): Promise<TenantEntitlements | null> {
    if (memoryEntitlementsCache.has(companyId)) {
      return memoryEntitlementsCache.get(companyId)!;
    }
    try {
      const snap = await getDoc(getEntitlementsDocRef(companyId));
      if (snap.exists()) {
        const ent = snap.data() as TenantEntitlements;
        memoryEntitlementsCache.set(companyId, ent);
        return ent;
      }
    } catch (err) {
      console.warn(`[tenantRepository] Failed to fetch entitlements for ${companyId}:`, err);
    }
    return null;
  },

  async saveEntitlements(entitlements: TenantEntitlements): Promise<void> {
    memoryEntitlementsCache.set(entitlements.companyId, entitlements);
    await setDoc(getEntitlementsDocRef(entitlements.companyId), entitlements, { merge: true });
  },

  // 3. User Memberships
  async getMembership(companyId: string, userId: string): Promise<UserMembership | null> {
    try {
      const snap = await getDoc(getMemberDocRef(companyId, userId));
      return snap.exists() ? (snap.data() as UserMembership) : null;
    } catch (err) {
      console.warn(`[tenantRepository] Failed to fetch membership:`, err);
      return null;
    }
  },

  async saveMembership(membership: UserMembership): Promise<void> {
    await setDoc(getMemberDocRef(membership.companyId, membership.userId), membership, { merge: true });
  },

  async listMemberships(companyId: string): Promise<UserMembership[]> {
    try {
      const snap = await getDocs(collection(db, 'companies', companyId, 'members'));
      return snap.docs.map(d => d.data() as UserMembership);
    } catch (err) {
      console.warn(`[tenantRepository] Failed to list memberships for ${companyId}:`, err);
      return [];
    }
  },

  async deleteMembership(companyId: string, userId: string): Promise<void> {
    try {
      await deleteDoc(getMemberDocRef(companyId, userId));
    } catch (err) {
      console.warn(`[tenantRepository] Failed to delete membership ${userId}:`, err);
    }
  },

  // 4. Factory Configuration
  async getFactoryConfiguration(companyId: string, factoryId: string): Promise<FactoryConfiguration | null> {
    const cacheKey = `${companyId}:${factoryId}`;
    if (memoryConfigCache.has(cacheKey)) {
      return memoryConfigCache.get(cacheKey)!;
    }
    try {
      const snap = await getDoc(getFactorySettingsDocRef(companyId, factoryId));
      if (snap.exists()) {
        const config = snap.data() as FactoryConfiguration;
        memoryConfigCache.set(cacheKey, config);
        return config;
      }
    } catch (err) {
      console.warn(`[tenantRepository] Failed to get factory config:`, err);
    }
    return null;
  },

  async saveFactoryConfiguration(config: FactoryConfiguration): Promise<void> {
    const cacheKey = `${config.companyId}:${config.factoryId}`;
    memoryConfigCache.set(cacheKey, config);
    await setDoc(getFactorySettingsDocRef(config.companyId, config.factoryId), config, { merge: true });
  },

  // 5. Setup Draft (Resumable Onboarding)
  async getSetupDraft<T = any>(companyId: string, factoryId: string): Promise<T | null> {
    try {
      const snap = await getDoc(getFactorySetupDraftDocRef(companyId, factoryId));
      return snap.exists() ? (snap.data() as T) : null;
    } catch (err) {
      console.warn(`[tenantRepository] Failed to get setup draft:`, err);
      return null;
    }
  },

  async saveSetupDraft(companyId: string, factoryId: string, draft: any): Promise<void> {
    await setDoc(getFactorySetupDraftDocRef(companyId, factoryId), {
      ...draft,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  },

  async clearSetupDraft(companyId: string, factoryId: string): Promise<void> {
    await deleteDoc(getFactorySetupDraftDocRef(companyId, factoryId)).catch(() => {});
  },

  // 6. Production Jobs
  async getProductionJobs(companyId: string, factoryId: string): Promise<ProductionJobRecord[]> {
    const cacheKey = `${companyId}:${factoryId}`;
    if (memoryJobsCache.has(cacheKey)) {
      return memoryJobsCache.get(cacheKey)!;
    }
    try {
      const snap = await getDocs(getFactoryJobsCollectionRef(companyId, factoryId));
      const jobs = snap.docs.map((d) => d.data() as ProductionJobRecord);
      memoryJobsCache.set(cacheKey, jobs);
      return jobs;
    } catch (err) {
      console.warn(`[tenantRepository] Failed to fetch production jobs:`, err);
      return memoryJobsCache.get(cacheKey) || [];
    }
  },

  async saveProductionJob(job: ProductionJobRecord): Promise<void> {
    const cacheKey = `${job.companyId}:${job.factoryId}`;
    const current = memoryJobsCache.get(cacheKey) || [];
    const idx = current.findIndex((j) => j.id === job.id);
    const updated = idx >= 0 ? current.map((j, i) => (i === idx ? job : j)) : [job, ...current];
    memoryJobsCache.set(cacheKey, updated);

    const jobDocRef = doc(db, 'companies', job.companyId, 'factories', job.factoryId, 'jobs', job.id);
    await setDoc(jobDocRef, job, { merge: true });
  },
};

