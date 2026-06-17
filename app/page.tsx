'use client';
import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import HomeContent from './Pages/Home';

export default function HomeRoot() {
  return (
    <DashboardLayout title="Home">
      <HomeContent />
    </DashboardLayout>
  );
}