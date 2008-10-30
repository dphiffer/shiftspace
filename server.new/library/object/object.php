<?php

class Object extends Base {
  
  public $contents = array(
    'values' => array()
  );
  
  static public function factory($options) {
    if (is_string($options)) {
      $options = array(
        'class' => $options
      );
    }
    $class = "{$options['class']}_Object";
    $object = new $class($options);
    if (!empty($options['values'])) {
      foreach ($options['values'] as $key => $value) {
        $object->$key = $value;
      }
    }
    if (!empty($options['_store'])) {
      $object->_store = $options['_store'];
    }
    return $object;
  }
  
  public function save($store = false) {
    if (empty($store) && empty($this->contents['_store'])) {
      throw new Exception("Save failed, no store provided.");
    } else if (empty($store)) {
      $store = $this->contents['_store'];
    }
    $store->save($this);
  }
  
  public function __get($key) {
    if (substr($key, 0, 1) == '_') {
      if (isset($this->contents[$key])) {
        return $this->contents[$key];
      } else {
        return false;
      }
    }
    return $this->get($key);
  }
  
  public function __set($key, $value) {
    if (substr($key, 0, 1) == '_') {
      $this->contents[$key] = $value;
    } else {
      $this->set($key, $value);
    }
  }
  
  public function __isset($key) {
    if (substr($key, 0, 1) == '_') {
      return isset($this->contents[$key]);
    } else {
      return isset($this->contents['values'][$key]);
    }
  }
  
  public function __unset($key) {
    if (substr($key, 0, 1) == '_') {
      unset($this->contents[$key]);
    } else {
      unset($this->contents['values'][$key]);
    }
  }
  
}

?>