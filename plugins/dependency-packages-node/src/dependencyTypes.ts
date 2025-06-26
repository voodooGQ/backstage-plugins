import express from 'express';

export type DependencyType= {
  id: string;
  version: string;
  annotation: string;
  router: express.Router;
  title?: string;
  description?: string;
};
