import { useState, useRef, useCallback } from 'react';

export interface PoseScore {
  poseName: string;
  scores: number[];
  averageScore: number;
}

export function usePoseScoring() {
  const [poseScores, setPoseScores] = useState<PoseScore[]>([]);
  const currentPoseScoresRef = useRef<number[]>([]);

  const addScore = useCallback((score: number) => {
    currentPoseScoresRef.current.push(score);
  }, []);

  const resetCurrentScores = useCallback(() => {
    currentPoseScoresRef.current = [];
  }, []);

  const savePoseScore = useCallback((poseName: string): PoseScore[] => {
    const scores = currentPoseScoresRef.current;
    if (scores.length > 0) {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const newPoseScore: PoseScore = {
        poseName,
        scores: [...scores],
        averageScore: avgScore,
      };
      const updatedScores = [...poseScores, newPoseScore];
      setPoseScores(updatedScores);
      return updatedScores;
    }
    return poseScores;
  }, [poseScores]);

  const getAllScores = useCallback(() => {
    return poseScores;
  }, [poseScores]);

  return {
    poseScores,
    addScore,
    resetCurrentScores,
    savePoseScore,
    getAllScores,
  };
}
