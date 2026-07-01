#!/usr/bin/env sh
if [ -f backend/.env.example ]; then
  sed -i 's/^GEMINI_API_KEY=.*/GEMINI_API_KEY=your-gemini-api-key/' backend/.env.example
fi
