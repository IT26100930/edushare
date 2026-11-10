package com.edushare.shared;

import com.fasterxml.jackson.core.*;
import com.fasterxml.jackson.databind.*;

import java.io.IOException;

/** Reject fractions rather than silently truncating a selling price or limit. */
public class WholeRupeeDeserializer extends JsonDeserializer<Integer> {

    @Override
    public Integer deserialize(JsonParser parser, DeserializationContext context)
            throws IOException {
        if (parser.currentToken() != JsonToken.VALUE_NUMBER_INT) {
            throw JsonMappingException.from(parser, "Enter a whole rupee amount.");
        }
        return parser.getIntValue();
    }
}
