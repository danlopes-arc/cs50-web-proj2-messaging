import datetime

def dictify(obj):
  if hasattr(obj, "__dict__"):
    d = obj.__dict__
    return dictify(d)
  if type(obj) is list:
    lst = []
    for v in obj:
      lst.append(dictify(v))
    return lst
  if type(obj) is dict:
    dct = dict()
    for key, value in obj.items():
      dct[key] = dictify(value)
    return dct
  return obj
  
class Channel:
  def __init__(self, name):
    self.name = name
    self.messages = []

class Message:
  def __init__(self, user, text, date_time):
    self.user = user
    self.text = text
    self.datetime = date_time

class EasyDateTime:
  def __init__(self, year=0, month=0, day=0, hour=0, minute=0, second=0, micro=0, date_time=None):
    if date_time != None:
      self.year = date_time.year
      self.month = date_time.month
      self.day = date_time.day
      self.hour = date_time.hour
      self.minute = date_time.minute
      self.second = date_time.second
      self.micro = date_time.microsecond
      return

    self.year = year
    self.month = month
    self.day = day
    self.hour = hour
    self.minute = minute
    self.second = second
    self.micro = micro
