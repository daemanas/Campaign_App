# API routes

Base `/api/v1`

- POST `/auth/register`, POST `/auth/login`, GET/PATCH `/auth/me`
- GET `/campaigns?q=&category=`, GET `/campaigns/mine`, GET `/campaigns/saved/mine`
- POST `/campaigns`, GET `/campaigns/:id`, PATCH `/campaigns/:id`, POST `/campaigns/:id/save`
- POST `/contributions`, GET `/contributions/mine`
- GET `/activity`, PATCH `/activity/:id/read`, GET `/activity/summary`
  Protected routes require `Authorization: Bearer <JWT>`.
