package com.edushare.modules.review;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonMappingException;
import java.io.IOException;

/** Reject fractional or string ratings instead of silently truncating/coercing them. */
public class StarRatingDeserializer extends JsonDeserializer<Integer> {
  @Override
  public Integer deserialize(JsonParser parser, DeserializationContext context) throws IOException {
    if (parser.currentToken() != JsonToken.VALUE_NUMBER_INT) {
      throw JsonMappingException.from(parser, "Choose a whole star rating from 1 to 5.");
    }
    return parser.getIntValue();
  }
}
