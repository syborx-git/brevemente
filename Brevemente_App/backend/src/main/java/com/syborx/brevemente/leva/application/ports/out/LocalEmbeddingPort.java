package com.syborx.brevemente.leva.application.ports.out;

import java.util.List;

public interface LocalEmbeddingPort {

    List<Float> generateEmbedding(String text);

    double calculateCosineSimilarity(List<Float> vectorA, List<Float> vectorB);
}

