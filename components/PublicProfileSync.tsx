"use client";

import { useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { syncPublicProfile } from "@/lib/public-profile";

export default function PublicProfileSync() {
  const { user, profile, loading, profileLoading } = useAuth();
  const fingerprint = useMemo(() => {
    if (!profile) return "";
    return JSON.stringify({
      uid: profile.uid,
      role: profile.role,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      city: profile.city,
      bio: profile.bio,
      professionalTitle: profile.professionalTitle,
      skills: profile.skills,
      hourlyRate: profile.hourlyRate,
      experienceYears: profile.experienceYears,
      languages: profile.languages,
      availability: profile.availability,
      portfolioUrl: profile.portfolioUrl,
      certifications: profile.certifications,
      organization: profile.organization,
      hiringNeeds: profile.hiringNeeds,
      profileComplete: profile.profileComplete,
      onboarded: profile.onboarded,
      interviewStatus: profile.interviewStatus,
      verified: profile.verified,
      trustScore: profile.trustScore,
    });
  }, [profile]);

  useEffect(() => {
    if (loading || profileLoading || !user || !profile || !fingerprint) return;
    const timer = window.setTimeout(() => {
      syncPublicProfile().catch(() => undefined);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [loading, profileLoading, user, profile, fingerprint]);

  return null;
}
